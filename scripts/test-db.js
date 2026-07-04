/* Exercises the real src/main/database.js DAL in Node with Electron stubbed,
   to reproduce the create/reflection failures reported in the packaged app. */
const os = require('os');
const path = require('path');
const Module = require('module');

const origLoad = Module._load;
Module._load = function (request, _parent, _isMain) {
  if (request === 'electron') {
    return {
      app: {
        getPath: () => path.join(os.tmpdir(), 'momentum-dbtest'),
        isPackaged: false,
      },
    };
  }
  return origLoad.apply(this, arguments);
};

const fs = require('fs');
const dir = path.join(os.tmpdir(), 'momentum-dbtest');
try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
// start clean
try { fs.unlinkSync(path.join(dir, 'momentum.sqlite')); } catch (_) {}

const db = require('../src/main/database');

(async () => {
  await db.init();
  console.log('init OK');

  const t = db.tasks.create({ title: 'Hello world', tags: ['x'], subtasks: [{ id: 's1', title: 'sub', done: false }] });
  console.log('create task OK:', t && t.id, t && t.title);

  console.log('list tasks:', db.tasks.list().length);

  const p = db.projects.create({ name: 'My Project', color: '#64b5f6' });
  console.log('create project OK:', p && p.id, p && p.name);

  const upd = db.tasks.update(t.id, { projectId: p.id, priority: 'High', isStarred: true });
  console.log('update task OK:', upd && upd.projectId, upd && upd.priority);

  const r = db.reflections.upsert({ wins: 'w', learnings: 'l', tomorrow: 't', mood: '🔥' });
  console.log('reflection upsert OK:', r && r.date, r && r.wins);
  console.log('reflection list:', db.reflections.list().length);

  const done = db.tasks.setCompleted(t.id, true);
  console.log('setCompleted OK:', done && done.isCompleted);
  console.log('streak:', JSON.stringify(db.streaks.get()));

  db.tasks.reorder([t.id]);
  console.log('reorder OK');

  console.log('projects.update:', !!db.projects.update(p.id, { name: 'Renamed' }));
  console.log('reflections.list:', db.reflections.list().length);
  console.log('analytics.daily:', db.analytics.dailyCompletions(30).length, 'totals:', JSON.stringify(db.analytics.totals()));

  const imp = db.importData({
    projects: [{ id: 'imp-p', name: 'Imported', color: '#64b5f6' }],
    tasks: [{ id: 'imp-t', title: 'Imported task', projectId: 'imp-p', tags: ['t'], subtasks: [] }],
    reflections: [{ date: '2025-01-01', wins: 'past win' }],
  });
  console.log('importData:', JSON.stringify(imp));
  console.log('after import — tasks:', db.tasks.list().length, 'projects:', db.projects.list().length, 'reflections:', db.reflections.list().length);

  console.log('projects.remove:', JSON.stringify(db.projects.remove(p.id)));

  console.log('ALL DAL OPERATIONS SUCCEEDED');
})().catch((e) => {
  console.error('DAL ERROR:', e);
  process.exit(1);
});
