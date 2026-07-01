const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const db = require('./database');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// These globals are injected by the Electron Forge Webpack plugin.
// eslint-disable-next-line no-undef
const ENTRY = MAIN_WINDOW_WEBPACK_ENTRY;
// eslint-disable-next-line no-undef
const PRELOAD = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;

const settings = new Store({ name: 'momentum-settings' });

let mainWindow = null;

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
  handle('reflections:upsert', (input) => db.reflections.upsert(input));

  // Analytics
  handle('analytics:daily', (days) => db.analytics.dailyCompletions(days));
  handle('analytics:totals', () => db.analytics.totals());

  // Settings (electron-store)
  handle('settings:get', (key, fallback) => settings.get(key, fallback));
  handle('settings:set', (key, value) => {
    settings.set(key, value);
    return value;
  });
  handle('settings:all', () => settings.store);
}

app.whenReady().then(async () => {
  try {
    await db.init();
  } catch (err) {
    console.error('[db] initialization failed:', err);
  }
  registerIpc();
  Menu.setApplicationMenu(null);
  createWindow();

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
});
