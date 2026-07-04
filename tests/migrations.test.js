/**
 * migrations.test.js — verifies the versioned migration runner upgrades a
 * database created by an older version (one without the `dependsOn` column).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs';
import Module from 'module';
import { createRequire } from 'module';

const nodeRequire = createRequire(import.meta.url);
const tmpDir = path.join(os.tmpdir(), 'momentum-migration-test');
const dbFile = path.join(tmpDir, 'momentum.sqlite');

// The tasks table as it existed BEFORE dependsOn was introduced.
const LEGACY_TASKS = `CREATE TABLE tasks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, projectId TEXT,
  priority TEXT, energyRequired TEXT, timeEstimate INTEGER, bestTime TEXT,
  dueDate TEXT, completedDate TEXT, isCompleted INTEGER, isRecurring INTEGER,
  recurrencePattern TEXT, isStarred INTEGER, tags TEXT, subtasks TEXT,
  sortOrder INTEGER, createdAt TEXT, updatedAt TEXT
);`;

let db;
let restoreLoad;

beforeAll(async () => {
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    fs.unlinkSync(dbFile);
  } catch (_) {
    /* fresh */
  }

  // Build a legacy DB file (no dependsOn column, user_version still 0).
  const initSqlJs = nodeRequire('sql.js');
  const SQL = await initSqlJs();
  const legacy = new SQL.Database();
  legacy.run(LEGACY_TASKS);
  legacy.run("INSERT INTO tasks (id, title, tags, subtasks) VALUES ('old', 'Legacy task', '[]', '[]')");
  fs.writeFileSync(dbFile, Buffer.from(legacy.export()));
  legacy.close();

  // Point database.js at our temp dir, load a fresh instance, and init it.
  const origLoad = Module._load;
  restoreLoad = () => {
    Module._load = origLoad;
  };
  Module._load = function (request, ...rest) {
    if (request === 'electron') {
      return { app: { getPath: () => tmpDir, isPackaged: false } };
    }
    return origLoad.call(this, request, ...rest);
  };
  delete nodeRequire.cache[nodeRequire.resolve('../src/main/database.js')];
  db = nodeRequire('../src/main/database.js');
  await db.init();
});

afterAll(() => {
  if (restoreLoad) restoreLoad();
});

describe('schema migrations', () => {
  it('adds dependsOn to a legacy database and defaults it to []', () => {
    const legacy = db.tasks.get('old');
    expect(legacy).toBeTruthy();
    expect(legacy.dependsOn).toEqual([]);
  });

  it('lets tasks store and read back dependsOn after migrating', () => {
    db.tasks.create({ id: 'new', title: 'New', dependsOn: ['old'] });
    expect(db.tasks.get('new').dependsOn).toEqual(['old']);
  });
});
