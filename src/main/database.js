/**
 * database.js — SQLite persistence for Momentum.
 *
 * Uses sql.js (SQLite compiled to WebAssembly) so no native compilation is
 * required. The database lives in memory while the app runs and is serialized
 * to a single file in the user-data directory after every mutation (debounced)
 * and on quit.
 *
 * This module is the single data-access layer. If you later install native
 * build tools, only the internals here need to change to swap in better-sqlite3
 * — the exported function surface can stay identical.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { v4: uuid } = require('uuid');
const { nextDueDate } = require('../shared/recurrence');
const { resetSubtasks } = require('../shared/subtasks');

let SQL = null; // the sql.js module
let db = null; // the active Database instance
let dbPath = null;
let persistTimer = null;

/**
 * Load the sql.js module. It is intentionally NOT webpack-bundled (emscripten
 * glue does not survive bundling well), so we require it dynamically: from the
 * packaged resources when installed, or from node_modules in development.
 * `eval('require')` bypasses webpack's static resolution.
 */
function loadSqlJs() {
  const nodeRequire = eval('require');
  const candidates = [];
  if (app.isPackaged && process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'sql-wasm.js'));
  }
  candidates.push('sql.js');
  candidates.push(
    path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.js')
  );
  let lastErr;
  for (const candidate of candidates) {
    try {
      const mod = nodeRequire(candidate);
      try {
        require('./logger').log('sql.js loaded from', candidate);
      } catch (_) {
        /* logger optional */
      }
      return mod;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Could not load sql.js');
}

/** Resolve the sql-wasm.wasm binary location for dev and packaged builds. */
function resolveWasmBinary() {
  const candidates = [];

  // Packaged: copied next to the app via forge.config extraResource.
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'sql-wasm.wasm'));
  }

  // Resolve through the *real* Node require. `eval('require')` bypasses
  // webpack's static analysis (sql.js is an external), so this returns the
  // genuine runtime resolver which walks up from .webpack/main to node_modules.
  try {
    const nodeRequire = eval('require');
    const entry = nodeRequire.resolve('sql.js'); // -> .../sql.js/dist/sql-wasm.js
    candidates.push(path.join(path.dirname(entry), 'sql-wasm.wasm'));
  } catch (_) {
    /* fall through to path-based candidates */
  }

  // Dev fallbacks relative to the bundled main file and the working dir.
  candidates.push(
    path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  );

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      try {
        require('./logger').log('wasm resolved from', candidate);
      } catch (_) {
        /* logger optional */
      }
      return fs.readFileSync(candidate);
    }
  }
  throw new Error(
    'Could not locate sql-wasm.wasm. Looked in: ' + candidates.join(', ')
  );
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  projectId TEXT REFERENCES projects(id),
  priority TEXT DEFAULT 'Medium',
  energyRequired TEXT DEFAULT 'Medium',
  timeEstimate INTEGER,
  bestTime TEXT,
  dueDate TEXT,
  completedDate TEXT,
  isCompleted INTEGER DEFAULT 0,
  isRecurring INTEGER DEFAULT 0,
  recurrencePattern TEXT,
  isStarred INTEGER DEFAULT 0,
  tags TEXT,
  subtasks TEXT,
  dependsOn TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#d4af37',
  isFavorite INTEGER DEFAULT 0,
  isArchived INTEGER DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY,
  currentStreak INTEGER DEFAULT 0,
  longestStreak INTEGER DEFAULT 0,
  lastCompletedDate TEXT,
  startDate TEXT
);

CREATE TABLE IF NOT EXISTS completionHistory (
  id TEXT PRIMARY KEY,
  taskId TEXT REFERENCES tasks(id),
  completedAt TEXT,
  timeToComplete INTEGER,
  energyUsed TEXT,
  difficulty TEXT
);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  date TEXT,
  wins TEXT,
  learnings TEXT,
  tomorrow TEXT,
  mood TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(isCompleted);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(dueDate);
CREATE INDEX IF NOT EXISTS idx_history_task ON completionHistory(taskId);
`;

/** Add a column to an existing table if it's missing (idempotent). CREATE
    TABLE IF NOT EXISTS won't alter a table a previous version already created. */
function ensureColumn(table, column, ddl) {
  const cols = all(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

/**
 * Versioned schema migrations, tracked with SQLite's `PRAGMA user_version`.
 * The base SCHEMA above creates the *current* tables for fresh installs; these
 * migrations bring older databases forward. Each `up` is idempotent so it's
 * safe on both fresh and existing DBs. To evolve the schema, bump the SCHEMA
 * (for fresh installs) AND append a migration here — never mutate an old one.
 */
const MIGRATIONS = [
  {
    version: 1,
    up() {
      ensureColumn('tasks', 'dependsOn', 'dependsOn TEXT');
    },
  },
];

/** Apply any migrations newer than the database's recorded user_version. */
function runMigrations() {
  const row = get('PRAGMA user_version');
  let current = row ? row.user_version : 0;
  for (const m of MIGRATIONS) {
    if (m.version > current) {
      m.up();
      current = m.version;
    }
  }
  db.run(`PRAGMA user_version = ${current}`);
}

/** Initialize the database engine and load (or create) the on-disk file. */
async function init() {
  if (db) return;
  const initSqlJs = loadSqlJs();
  SQL = await initSqlJs({ wasmBinary: resolveWasmBinary() });

  dbPath = path.join(app.getPath('userData'), 'momentum.sqlite');
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  runMigrations();
  ensureSingletonStreak();
  persistNow();
}

/** Serialize the in-memory database to disk immediately. */
function persistNow() {
  if (!db || !dbPath) return;
  const data = Buffer.from(db.export());
  fs.writeFileSync(dbPath, data);
}

/** Debounced persist used after mutations to avoid thrashing the disk. */
function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 250);
}

// ---------------------------------------------------------------------------
// Low-level query helpers
// ---------------------------------------------------------------------------

function all(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = {}) {
  const rows = all(sql, params);
  return rows[0] || null;
}

function run(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  schedulePersist();
}

// ---------------------------------------------------------------------------
// Row mappers (SQLite has no booleans / arrays)
// ---------------------------------------------------------------------------

function toBool(v) {
  return v === 1 || v === '1' || v === true;
}

function parseJson(v, fallback) {
  if (v == null || v === '') return fallback;
  try {
    return JSON.parse(v);
  } catch (_) {
    return fallback;
  }
}

function mapTask(row) {
  if (!row) return null;
  return {
    ...row,
    isCompleted: toBool(row.isCompleted),
    isRecurring: toBool(row.isRecurring),
    isStarred: toBool(row.isStarred),
    tags: parseJson(row.tags, []),
    subtasks: parseJson(row.subtasks, []),
    dependsOn: parseJson(row.dependsOn, []),
  };
}

function mapProject(row) {
  if (!row) return null;
  return {
    ...row,
    isFavorite: toBool(row.isFavorite),
    isArchived: toBool(row.isArchived),
  };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const tasks = {
  list() {
    return all(
      'SELECT * FROM tasks ORDER BY isCompleted ASC, sortOrder ASC, createdAt DESC'
    ).map(mapTask);
  },

  get(id) {
    return mapTask(get('SELECT * FROM tasks WHERE id = $id', { $id: id }));
  },

  create(input = {}) {
    const now = new Date().toISOString();
    const id = input.id || uuid();
    run(
      `INSERT INTO tasks (
        id, title, description, projectId, priority, energyRequired,
        timeEstimate, bestTime, dueDate, completedDate, isCompleted,
        isRecurring, recurrencePattern, isStarred, tags, subtasks, dependsOn,
        sortOrder, createdAt, updatedAt
      ) VALUES (
        $id, $title, $description, $projectId, $priority, $energyRequired,
        $timeEstimate, $bestTime, $dueDate, $completedDate, $isCompleted,
        $isRecurring, $recurrencePattern, $isStarred, $tags, $subtasks, $dependsOn,
        $sortOrder, $createdAt, $updatedAt
      )`,
      {
        $id: id,
        $title: input.title || 'Untitled task',
        $description: input.description || null,
        $projectId: input.projectId || null,
        $priority: input.priority || 'Medium',
        $energyRequired: input.energyRequired || 'Medium',
        $timeEstimate: input.timeEstimate ?? null,
        $bestTime: input.bestTime || 'Anytime',
        $dueDate: input.dueDate || null,
        $completedDate: null,
        $isCompleted: 0,
        $isRecurring: input.isRecurring ? 1 : 0,
        $recurrencePattern: input.recurrencePattern || null,
        $isStarred: input.isStarred ? 1 : 0,
        $tags: JSON.stringify(input.tags || []),
        $subtasks: JSON.stringify(input.subtasks || []),
        $dependsOn: JSON.stringify(input.dependsOn || []),
        $sortOrder: input.sortOrder ?? 0,
        $createdAt: now,
        $updatedAt: now,
      }
    );
    return this.get(id);
  },

  update(id, updates = {}) {
    const existing = this.get(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    run(
      `UPDATE tasks SET
        title = $title, description = $description, projectId = $projectId,
        priority = $priority, energyRequired = $energyRequired,
        timeEstimate = $timeEstimate, bestTime = $bestTime, dueDate = $dueDate,
        completedDate = $completedDate, isCompleted = $isCompleted,
        isRecurring = $isRecurring, recurrencePattern = $recurrencePattern,
        isStarred = $isStarred, tags = $tags, subtasks = $subtasks,
        dependsOn = $dependsOn, sortOrder = $sortOrder, updatedAt = $updatedAt
      WHERE id = $id`,
      {
        $id: id,
        $title: merged.title,
        $description: merged.description || null,
        $projectId: merged.projectId || null,
        $priority: merged.priority,
        $energyRequired: merged.energyRequired,
        $timeEstimate: merged.timeEstimate ?? null,
        $bestTime: merged.bestTime || 'Anytime',
        $dueDate: merged.dueDate || null,
        $completedDate: merged.completedDate || null,
        $isCompleted: merged.isCompleted ? 1 : 0,
        $isRecurring: merged.isRecurring ? 1 : 0,
        $recurrencePattern: merged.recurrencePattern || null,
        $isStarred: merged.isStarred ? 1 : 0,
        $tags: JSON.stringify(merged.tags || []),
        $subtasks: JSON.stringify(merged.subtasks || []),
        $dependsOn: JSON.stringify(merged.dependsOn || []),
        $sortOrder: merged.sortOrder ?? 0,
        $updatedAt: new Date().toISOString(),
      }
    );
    return this.get(id);
  },

  remove(id) {
    run('DELETE FROM tasks WHERE id = $id', { $id: id });
    return { id };
  },

  /** Persist an explicit manual order by writing sortOrder = position. */
  reorder(orderedIds = []) {
    const now = new Date().toISOString();
    orderedIds.forEach((id, i) => {
      run('UPDATE tasks SET sortOrder = $o, updatedAt = $u WHERE id = $id', {
        $id: id,
        $o: i,
        $u: now,
      });
    });
    return this.list();
  },

  /** Toggle completion, record history, and update the streak. */
  setCompleted(id, isCompleted) {
    const task = this.get(id);
    if (!task) return null;
    const now = new Date().toISOString();
    run(
      `UPDATE tasks SET isCompleted = $c, completedDate = $d, updatedAt = $u WHERE id = $id`,
      {
        $id: id,
        $c: isCompleted ? 1 : 0,
        $d: isCompleted ? now : null,
        $u: now,
      }
    );
    if (isCompleted) {
      run(
        `INSERT INTO completionHistory (id, taskId, completedAt, timeToComplete, energyUsed, difficulty)
         VALUES ($id, $taskId, $at, $ttc, $energy, $diff)`,
        {
          $id: uuid(),
          $taskId: id,
          $at: now,
          $ttc: task.timeEstimate ?? null,
          $energy: task.energyRequired || null,
          $diff: null,
        }
      );
      streaks.registerCompletion(now);

      // Recurring tasks spawn their next occurrence on completion.
      if (task.isRecurring && task.recurrencePattern) {
        this.create({
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          priority: task.priority,
          energyRequired: task.energyRequired,
          timeEstimate: task.timeEstimate,
          bestTime: task.bestTime,
          dueDate: nextDueDate(task.dueDate, task.recurrencePattern),
          isRecurring: true,
          recurrencePattern: task.recurrencePattern,
          isStarred: task.isStarred,
          tags: task.tags,
          subtasks: resetSubtasks(task.subtasks),
          dependsOn: task.dependsOn,
        });
      }
    }
    return this.get(id);
  },
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const projects = {
  list() {
    return all(
      'SELECT * FROM projects WHERE isArchived = 0 ORDER BY isFavorite DESC, createdAt DESC'
    ).map(mapProject);
  },

  create(input = {}) {
    const now = new Date().toISOString();
    const id = input.id || uuid();
    run(
      `INSERT INTO projects (id, name, description, color, isFavorite, isArchived, createdAt, updatedAt)
       VALUES ($id, $name, $description, $color, $fav, 0, $createdAt, $updatedAt)`,
      {
        $id: id,
        $name: input.name || 'New project',
        $description: input.description || null,
        $color: input.color || '#d4af37',
        $fav: input.isFavorite ? 1 : 0,
        $createdAt: now,
        $updatedAt: now,
      }
    );
    return mapProject(get('SELECT * FROM projects WHERE id = $id', { $id: id }));
  },

  update(id, updates = {}) {
    const existing = mapProject(
      get('SELECT * FROM projects WHERE id = $id', { $id: id })
    );
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    run(
      `UPDATE projects SET name = $name, description = $description, color = $color,
        isFavorite = $fav, isArchived = $arch, updatedAt = $u WHERE id = $id`,
      {
        $id: id,
        $name: merged.name,
        $description: merged.description || null,
        $color: merged.color,
        $fav: merged.isFavorite ? 1 : 0,
        $arch: merged.isArchived ? 1 : 0,
        $u: new Date().toISOString(),
      }
    );
    return mapProject(get('SELECT * FROM projects WHERE id = $id', { $id: id }));
  },

  remove(id) {
    run('UPDATE tasks SET projectId = NULL WHERE projectId = $id', { $id: id });
    run('DELETE FROM projects WHERE id = $id', { $id: id });
    return { id };
  },
};

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

const STREAK_ID = 'primary';

function ensureSingletonStreak() {
  const row = get('SELECT * FROM streaks WHERE id = $id', { $id: STREAK_ID });
  if (!row) {
    run(
      `INSERT INTO streaks (id, currentStreak, longestStreak, lastCompletedDate, startDate)
       VALUES ($id, 0, 0, NULL, NULL)`,
      { $id: STREAK_ID }
    );
  }
}

function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function daysBetween(aKey, bKey) {
  const a = new Date(aKey + 'T00:00:00Z').getTime();
  const b = new Date(bKey + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86400000);
}

const streaks = {
  get() {
    return get('SELECT * FROM streaks WHERE id = $id', { $id: STREAK_ID });
  },

  /** Update the streak given a completion timestamp. Idempotent per day. */
  registerCompletion(iso) {
    const row = this.get();
    const today = dayKey(iso);
    if (row.lastCompletedDate === today) return row; // already counted today

    let current = row.currentStreak || 0;
    if (!row.lastCompletedDate) {
      current = 1;
    } else {
      const gap = daysBetween(row.lastCompletedDate, today);
      current = gap === 1 ? current + 1 : 1;
    }
    const longest = Math.max(current, row.longestStreak || 0);
    run(
      `UPDATE streaks SET currentStreak = $c, longestStreak = $l,
        lastCompletedDate = $d, startDate = COALESCE(startDate, $d) WHERE id = $id`,
      { $id: STREAK_ID, $c: current, $l: longest, $d: today }
    );
    return this.get();
  },
};

// ---------------------------------------------------------------------------
// Reflections
// ---------------------------------------------------------------------------

const reflections = {
  getByDate(date) {
    return get('SELECT * FROM reflections WHERE date = $d', { $d: date });
  },
  list(limit = 30) {
    return all('SELECT * FROM reflections ORDER BY date DESC LIMIT $lim', {
      $lim: limit,
    });
  },
  upsert(input = {}) {
    const date = input.date || dayKey(new Date().toISOString());
    const existing = this.getByDate(date);
    if (existing) {
      run(
        `UPDATE reflections SET wins = $w, learnings = $l, tomorrow = $t, mood = $m WHERE id = $id`,
        {
          $id: existing.id,
          $w: input.wins || null,
          $l: input.learnings || null,
          $t: input.tomorrow || null,
          $m: input.mood || null,
        }
      );
      return this.getByDate(date);
    }
    run(
      `INSERT INTO reflections (id, date, wins, learnings, tomorrow, mood)
       VALUES ($id, $date, $w, $l, $t, $m)`,
      {
        $id: uuid(),
        $date: date,
        $w: input.wins || null,
        $l: input.learnings || null,
        $t: input.tomorrow || null,
        $m: input.mood || null,
      }
    );
    return this.getByDate(date);
  },
};

// ---------------------------------------------------------------------------
// Analytics (computed on demand from completionHistory)
// ---------------------------------------------------------------------------

const analytics = {
  /** Completions per day, grouped from the full history. */
  dailyCompletions(_days = 30) {
    const rows = all(
      `SELECT substr(completedAt, 1, 10) AS day, COUNT(*) AS count
       FROM completionHistory GROUP BY day ORDER BY day ASC`
    );
    return rows;
  },
  totals() {
    const total = get('SELECT COUNT(*) AS n FROM completionHistory');
    const open = get('SELECT COUNT(*) AS n FROM tasks WHERE isCompleted = 0');
    return { completed: total ? total.n : 0, open: open ? open.n : 0 };
  },
};

/**
 * Wipe all user content and reset progress — the "Danger Zone" reset.
 * Removes tasks, projects, reflections and completion history, and zeroes the
 * streak. Preferences (electron-store settings) are intentionally left intact.
 */
function clearAll() {
  run('DELETE FROM completionHistory');
  run('DELETE FROM tasks');
  run('DELETE FROM projects');
  run('DELETE FROM reflections');
  run(
    `UPDATE streaks SET currentStreak = 0, longestStreak = 0,
      lastCompletedDate = NULL, startDate = NULL WHERE id = $id`,
    { $id: STREAK_ID }
  );
  persistNow();
  return { ok: true };
}

/** Merge an exported backup back in (idempotent by id / reflection date). */
function importData(payload = {}) {
  const now = new Date().toISOString();
  const counts = { projects: 0, tasks: 0, reflections: 0 };

  (payload.projects || []).forEach((p) => {
    if (!p || !p.id) return;
    run(
      `INSERT OR REPLACE INTO projects (id, name, description, color, isFavorite, isArchived, createdAt, updatedAt)
       VALUES ($id, $name, $description, $color, $fav, $arch, $createdAt, $updatedAt)`,
      {
        $id: p.id,
        $name: p.name || 'Project',
        $description: p.description || null,
        $color: p.color || '#d4af37',
        $fav: p.isFavorite ? 1 : 0,
        $arch: p.isArchived ? 1 : 0,
        $createdAt: p.createdAt || now,
        $updatedAt: p.updatedAt || now,
      }
    );
    counts.projects += 1;
  });

  (payload.tasks || []).forEach((t) => {
    if (!t || !t.id) return;
    run(
      `INSERT OR REPLACE INTO tasks (
        id, title, description, projectId, priority, energyRequired, timeEstimate,
        bestTime, dueDate, completedDate, isCompleted, isRecurring, recurrencePattern,
        isStarred, tags, subtasks, dependsOn, sortOrder, createdAt, updatedAt
      ) VALUES (
        $id, $title, $description, $projectId, $priority, $energyRequired, $timeEstimate,
        $bestTime, $dueDate, $completedDate, $isCompleted, $isRecurring, $recurrencePattern,
        $isStarred, $tags, $subtasks, $dependsOn, $sortOrder, $createdAt, $updatedAt
      )`,
      {
        $id: t.id,
        $title: t.title || 'Untitled task',
        $description: t.description || null,
        $projectId: t.projectId || null,
        $priority: t.priority || 'Medium',
        $energyRequired: t.energyRequired || 'Medium',
        $timeEstimate: t.timeEstimate ?? null,
        $bestTime: t.bestTime || 'Anytime',
        $dueDate: t.dueDate || null,
        $completedDate: t.completedDate || null,
        $isCompleted: t.isCompleted ? 1 : 0,
        $isRecurring: t.isRecurring ? 1 : 0,
        $recurrencePattern: t.recurrencePattern || null,
        $isStarred: t.isStarred ? 1 : 0,
        $tags: JSON.stringify(t.tags || []),
        $subtasks: JSON.stringify(t.subtasks || []),
        $dependsOn: JSON.stringify(t.dependsOn || []),
        $sortOrder: t.sortOrder ?? 0,
        $createdAt: t.createdAt || now,
        $updatedAt: t.updatedAt || now,
      }
    );
    counts.tasks += 1;
  });

  (payload.reflections || []).forEach((r) => {
    if (!r || !r.date) return;
    reflections.upsert(r);
    counts.reflections += 1;
  });

  // Restore the streak from the backup. `longestStreak` keeps whichever record
  // is higher so a restore never lowers a hard-won best.
  if (payload.streak) {
    const s = payload.streak;
    const existing = streaks.get() || {};
    run(
      `UPDATE streaks SET currentStreak = $c, longestStreak = $l,
        lastCompletedDate = $d, startDate = $sd WHERE id = $id`,
      {
        $id: STREAK_ID,
        $c: s.currentStreak || 0,
        $l: Math.max(s.longestStreak || 0, existing.longestStreak || 0),
        $d: s.lastCompletedDate || null,
        $sd: s.startDate || null,
      }
    );
  }

  persistNow();
  return counts;
}

module.exports = {
  init,
  persistNow,
  tasks,
  projects,
  streaks,
  reflections,
  analytics,
  importData,
  clearAll,
};
