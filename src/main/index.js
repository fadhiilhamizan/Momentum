const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const db = require('./database');
const { log } = require('./logger');

process.on('uncaughtException', (e) => log('uncaughtException', e));
process.on('unhandledRejection', (e) => log('unhandledRejection', e));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// These globals are injected by the Electron Forge Webpack plugin.
 
const ENTRY = MAIN_WINDOW_WEBPACK_ENTRY;
 
const PRELOAD = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;

const settings = new Store({ name: 'momentum-settings' });

let mainWindow = null;

/** Build the full export payload straight from the database. */
function buildBackupPayload() {
  return {
    app: 'Momentum',
    version: app.getVersion(),
    exportedAt: new Date().toISOString(),
    tasks: db.tasks.list(),
    projects: db.projects.list(),
    reflections: db.reflections.list(9999),
    streak: db.streaks.get(),
  };
}

/** Write a dated backup JSON into `dir` (one file per day). Returns file+time. */
function writeBackup(dir) {
  const file = path.join(dir, `momentum-backup-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(buildBackupPayload(), null, 2));
  const time = new Date().toISOString();
  settings.set('lastBackup', time);
  return { file, time };
}

/**
 * Enable auto-updates via update.electronjs.org (free, no server to run) once a
 * public GitHub repo with published Releases is configured. Set the repo via the
 * MOMENTUM_UPDATE_REPO env var ("owner/name"). No-ops in dev or when unset.
 */
function setupAutoUpdate() {
  if (!app.isPackaged) return;
  // Defaults to the project repo so shipped builds self-update out of the box;
  // override with MOMENTUM_UPDATE_REPO if you fork. Requires a PUBLIC repo with
  // published GitHub Releases (update.electronjs.org can't read private repos).
  const repo = process.env.MOMENTUM_UPDATE_REPO || 'fadhiilhamizan/Momentum';
  try {
    const { updateElectronApp } = require('update-electron-app');
    updateElectronApp({
      repo,
      updateInterval: '1 hour',
      logger: { log, info: log, warn: log, error: log },
    });
    log('auto-update: enabled for', repo);
  } catch (err) {
    log('auto-update setup failed', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0f0e0c',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(ENTRY);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// IPC — thin wrappers over the data-access layer. Each handler is wrapped so a
// thrown error surfaces as a rejected promise in the renderer instead of a
// silent failure.
// ---------------------------------------------------------------------------

function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return fn(...args);
    } catch (err) {
      console.error(`[ipc:${channel}]`, err);
      throw err;
    }
  });
}

function registerIpc() {
  // Tasks
  handle('tasks:list', () => db.tasks.list());
  handle('tasks:create', (input) => db.tasks.create(input));
  handle('tasks:update', (id, updates) => db.tasks.update(id, updates));
  handle('tasks:remove', (id) => db.tasks.remove(id));
  handle('tasks:reorder', (ids) => db.tasks.reorder(ids));
  handle('tasks:setCompleted', (id, isCompleted) =>
    db.tasks.setCompleted(id, isCompleted)
  );

  // Projects
  handle('projects:list', () => db.projects.list());
  handle('projects:create', (input) => db.projects.create(input));
  handle('projects:update', (id, updates) => db.projects.update(id, updates));
  handle('projects:remove', (id) => db.projects.remove(id));

  // Streak
  handle('streak:get', () => db.streaks.get());

  // Reflections
  handle('reflections:getByDate', (date) => db.reflections.getByDate(date));
  handle('reflections:list', (limit) => db.reflections.list(limit));
  handle('reflections:upsert', (input) => db.reflections.upsert(input));

  // Analytics
  handle('analytics:daily', (days) => db.analytics.dailyCompletions(days));
  handle('analytics:totals', () => db.analytics.totals());

  // Data import / reset
  handle('data:import', (payload) => db.importData(payload));
  handle('data:clear', () => db.clearAll());

  // Auto-backup to a folder
  handle('backup:choose', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a backup folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    return res.canceled || !res.filePaths.length ? null : res.filePaths[0];
  });
  handle('backup:now', (dir) => {
    const target = dir || settings.get('backupDir');
    if (!target) return { ok: false, reason: 'no-folder' };
    try {
      const { file, time } = writeBackup(target);
      return { ok: true, path: file, time };
    } catch (err) {
      log('backup:now failed', err);
      return { ok: false, reason: String(err) };
    }
  });

  // App metadata — the authoritative runtime version (matches the installed build).
  handle('app:getVersion', () => app.getVersion());

  // Settings (electron-store)
  handle('settings:get', (key, fallback) => settings.get(key, fallback));
  handle('settings:set', (key, value) => {
    settings.set(key, value);
    return value;
  });
  handle('settings:all', () => settings.store);
}

app.whenReady().then(async () => {
  log('app ready; isPackaged=', app.isPackaged, 'resourcesPath=', process.resourcesPath);
  try {
    await db.init();
    log('db.init OK');
  } catch (err) {
    log('db.init FAILED', err);
  }
  registerIpc();
  log('IPC registered');

  Menu.setApplicationMenu(null);
  createWindow();
  setupAutoUpdate();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try {
    db.persistNow();
  } catch (_) {
    /* nothing to flush */
  }
  try {
    if (settings.get('autoBackup') && settings.get('backupDir')) {
      writeBackup(settings.get('backupDir'));
    }
  } catch (err) {
    log('auto-backup failed', err);
  }
});
