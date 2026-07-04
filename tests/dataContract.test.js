/**
 * dataContract.test.js — runs one shared suite against BOTH data layers:
 * the localStorage mock (api.js) and the real SQLite layer (database.js).
 *
 * The two implementations are maintained by hand and have drifted before (the
 * streak-import bug, and every new task field like `dependsOn`). Asserting they
 * round-trip identical task shapes catches that whole class of bug.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs';
import Module from 'module';
import { createRequire } from 'module';
import api from '../src/renderer/utils/api.js';

const nodeRequire = createRequire(import.meta.url);
const tmpDir = path.join(os.tmpdir(), 'momentum-contract-test');

let db;
let restoreLoad;

function makeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

beforeAll(async () => {
  // Stub Electron before database.js loads (same trick as scripts/test-db.js).
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

  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    fs.unlinkSync(path.join(tmpDir, 'momentum.sqlite'));
  } catch (_) {
    /* fresh */
  }

  db = nodeRequire('../src/main/database.js');
  await db.init();
  globalThis.localStorage = makeLocalStorage();
});

afterAll(() => {
  if (restoreLoad) restoreLoad();
});

const mockAdapter = {
  create: (i) => api.tasks.create(i),
  list: () => api.tasks.list(),
  update: (id, p) => api.tasks.update(id, p),
  import: (p) => api.data.import(p),
};
const dbAdapter = {
  create: async (i) => db.tasks.create(i),
  list: async () => db.tasks.list(),
  update: async (id, p) => db.tasks.update(id, p),
  import: async (p) => db.importData(p),
};

function runTaskContract(name, adapter) {
  describe(`task data contract: ${name}`, () => {
    it('round-trips every task field through create + list', async () => {
      const input = {
        id: `${name}-t1`,
        title: 'Contract task',
        description: 'notes',
        priority: 'High',
        energyRequired: 'Low',
        timeEstimate: 30,
        bestTime: 'Morning',
        dueDate: '2026-07-10T09:00:00.000Z',
        isRecurring: true,
        recurrencePattern: 'weekly',
        isStarred: true,
        tags: ['x', 'y'],
        subtasks: [{ id: 's1', title: 'sub', done: false }],
        dependsOn: ['other-id'],
      };
      const created = await adapter.create(input);
      const got = (await adapter.list()).find((t) => t.id === input.id) || created;

      expect(got.title).toBe('Contract task');
      expect(got.description).toBe('notes');
      expect(got.priority).toBe('High');
      expect(got.energyRequired).toBe('Low');
      expect(got.timeEstimate).toBe(30);
      expect(got.bestTime).toBe('Morning');
      expect(got.dueDate).toBe('2026-07-10T09:00:00.000Z');
      expect(got.isRecurring).toBe(true);
      expect(got.recurrencePattern).toBe('weekly');
      expect(got.isStarred).toBe(true);
      expect(got.tags).toEqual(['x', 'y']);
      expect(got.subtasks).toEqual([{ id: 's1', title: 'sub', done: false }]);
      expect(got.dependsOn).toEqual(['other-id']);
    });

    it('update persists changed fields', async () => {
      const t = await adapter.create({ id: `${name}-t2`, title: 'Upd', tags: [] });
      await adapter.update(t.id, { tags: ['now'], dependsOn: ['dep'], priority: 'Critical' });
      const got = (await adapter.list()).find((x) => x.id === t.id);
      expect(got.tags).toEqual(['now']);
      expect(got.dependsOn).toEqual(['dep']);
      expect(got.priority).toBe('Critical');
    });

    it('import restores a task with its arrays intact', async () => {
      await adapter.import({
        tasks: [{ id: `${name}-imp`, title: 'Imported', tags: ['t'], dependsOn: ['d'], dueDate: null }],
      });
      const got = (await adapter.list()).find((x) => x.id === `${name}-imp`);
      expect(got).toBeTruthy();
      expect(got.tags).toEqual(['t']);
      expect(got.dependsOn).toEqual(['d']);
    });
  });
}

runTaskContract('mock', mockAdapter);
runTaskContract('sqlite', dbAdapter);
