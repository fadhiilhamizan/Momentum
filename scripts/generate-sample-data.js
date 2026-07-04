/* Generates momentum-sample-data.json — a rich, importable dataset that
   exercises every feature. Dates are anchored to 2026-07-04 ("today") and
   emitted WITHOUT a timezone so they read in the importer's local time. */
const fs = require('fs');
const path = require('path');

// Anchor "today". Noon keeps day arithmetic clear of DST edges.
const BASE = new Date(2026, 6, 4, 12, 0, 0);

function dayOffset(n) {
  const d = new Date(BASE.getTime());
  d.setDate(d.getDate() + n);
  return d;
}
const pad = (x) => String(x).padStart(2, '0');
/** Local, offset-less ISO (e.g. 2026-07-05T14:30:00) — interpreted in the
    importer's timezone. A 00:00 time means "date only". */
function iso(date, h = 0, m = 0) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(h)}:${pad(m)}:00`;
}
function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

let idc = 0;
const uid = (prefix) => `${prefix}-${pad(++idc)}`;
const now = iso(BASE, 12, 0);

const projects = [
  { id: 'proj-launch', name: 'Product Launch', description: 'Ship v2 to production', color: '#d4af37', isFavorite: true, isArchived: false, createdAt: iso(dayOffset(-45)), updatedAt: now },
  { id: 'proj-personal', name: 'Personal', description: 'Life admin & health', color: '#64b5f6', isFavorite: false, isArchived: false, createdAt: iso(dayOffset(-45)), updatedAt: now },
  { id: 'proj-learn', name: 'Learn Rust', description: 'Work through the book', color: '#7cb342', isFavorite: true, isArchived: false, createdAt: iso(dayOffset(-30)), updatedAt: now },
  { id: 'proj-home', name: 'Home', description: 'Chores & errands', color: '#ff8a65', isFavorite: false, isArchived: false, createdAt: iso(dayOffset(-20)), updatedAt: now },
];

function task(o) {
  return Object.assign(
    {
      id: uid('task'),
      title: 'Untitled',
      description: null,
      projectId: null,
      priority: 'Medium',
      energyRequired: 'Medium',
      timeEstimate: null,
      bestTime: 'Anytime',
      dueDate: null,
      completedDate: null,
      isCompleted: false,
      isRecurring: false,
      recurrencePattern: null,
      isStarred: false,
      tags: [],
      subtasks: [],
      dependsOn: [],
      sortOrder: 0,
      createdAt: iso(dayOffset(-10)),
      updatedAt: now,
    },
    o
  );
}

const active = [
  // Dependency chain: design -> build -> qa (build & qa are blocked)
  task({
    id: 'task-design',
    title: 'Design the onboarding flow',
    description: 'Wireframes, prototype and a round of feedback.',
    priority: 'High',
    energyRequired: 'High',
    timeEstimate: 120,
    bestTime: 'Morning',
    projectId: 'proj-launch',
    tags: ['launch', 'design'],
    dueDate: iso(dayOffset(0), 15, 30),
    subtasks: [
      {
        id: 'st-1',
        title: 'Sketch wireframes',
        done: true,
        dueDate: iso(dayOffset(-1)),
        children: [
          { id: 'st-1a', title: 'Mobile layout', done: true, children: [] },
          { id: 'st-1b', title: 'Desktop layout', done: false, dueDate: iso(dayOffset(1)), children: [] },
        ],
      },
      { id: 'st-2', title: 'Prototype in Figma', done: false, dueDate: iso(dayOffset(3)), children: [] },
      { id: 'st-3', title: 'Get feedback from the team', done: false, children: [] },
    ],
  }),
  task({ id: 'task-build', title: 'Build the onboarding UI', priority: 'Critical', energyRequired: 'High', timeEstimate: 120, bestTime: 'Afternoon', projectId: 'proj-launch', tags: ['launch', 'frontend'], dueDate: iso(dayOffset(4), 14, 0), dependsOn: ['task-design'] }),
  task({ id: 'task-qa', title: 'QA the onboarding release', priority: 'High', energyRequired: 'Medium', timeEstimate: 60, projectId: 'proj-launch', tags: ['launch', 'qa'], dueDate: iso(dayOffset(6)), dependsOn: ['task-build'] }),

  // Overdue + starred + timed
  task({ title: 'Fix the login redirect bug', priority: 'Critical', energyRequired: 'High', timeEstimate: 30, bestTime: 'Morning', projectId: 'proj-launch', tags: ['bug', 'urgent'], dueDate: iso(dayOffset(-2), 10, 0), isStarred: true }),
  // Overdue, date-only
  task({ title: 'Reply to launch emails', priority: 'Medium', energyRequired: 'Low', timeEstimate: 15, projectId: 'proj-launch', dueDate: iso(dayOffset(-1)) }),
  task({ title: 'Meal prep for the week', priority: 'Medium', energyRequired: 'Medium', timeEstimate: 60, projectId: 'proj-home', tags: ['health', 'cooking'], dueDate: iso(dayOffset(-3)) }),

  // Today
  task({ title: 'Water the plants', priority: 'Low', energyRequired: 'Low', timeEstimate: 5, projectId: 'proj-home', bestTime: 'Evening', dueDate: iso(dayOffset(0)), isRecurring: true, recurrencePattern: 'daily' }),
  task({ title: 'Grocery run', priority: 'Medium', energyRequired: 'Medium', timeEstimate: 30, projectId: 'proj-home', tags: ['errand'], dueDate: iso(dayOffset(0), 17, 0), isStarred: true }),

  // Recurrence variety
  task({ title: 'Weekly team sync', priority: 'Medium', energyRequired: 'Medium', timeEstimate: 30, bestTime: 'Morning', projectId: 'proj-launch', dueDate: iso(dayOffset(1), 9, 0), isRecurring: true, recurrencePattern: 'weekly' }),
  task({ title: 'Post stand-up notes', priority: 'Low', energyRequired: 'Low', timeEstimate: 5, projectId: 'proj-launch', dueDate: iso(dayOffset(2), 9, 15), isRecurring: true, recurrencePattern: 'weekdays' }),
  task({ title: 'Rust: the ownership chapter', priority: 'Medium', energyRequired: 'High', timeEstimate: 60, bestTime: 'Evening', projectId: 'proj-learn', tags: ['rust'], dueDate: iso(dayOffset(3), 20, 0), isRecurring: true, recurrencePattern: 'biweekly' }),
  task({ title: 'Pay rent', priority: 'High', energyRequired: 'Low', timeEstimate: 5, projectId: 'proj-personal', tags: ['finance'], dueDate: iso(dayOffset(11)), isRecurring: true, recurrencePattern: 'monthly-end' }),

  // Upcoming + subtasks + tags + best-time spread
  task({
    title: 'Refactor the auth module',
    priority: 'High',
    energyRequired: 'High',
    timeEstimate: 120,
    bestTime: 'Afternoon',
    projectId: 'proj-launch',
    tags: ['tech-debt'],
    dueDate: iso(dayOffset(7), 13, 0),
    subtasks: [
      { id: 'st-r1', title: 'Extract token logic', done: false, children: [] },
      { id: 'st-r2', title: 'Add unit tests', done: true, children: [] },
      { id: 'st-r3', title: 'Update the docs', done: false, dueDate: iso(dayOffset(8)), children: [] },
    ],
  }),
  task({ title: 'Book a dentist appointment', priority: 'Low', energyRequired: 'Low', timeEstimate: 10, projectId: 'proj-personal', tags: ['health'], dueDate: iso(dayOffset(5)) }),
  task({ title: 'Call mom', priority: 'Medium', energyRequired: 'Low', timeEstimate: 15, projectId: 'proj-personal', tags: ['family'], dueDate: iso(dayOffset(2), 19, 0) }),
  task({ title: 'Plan the Q3 roadmap', priority: 'High', energyRequired: 'High', timeEstimate: 120, bestTime: 'Morning', projectId: 'proj-launch', tags: ['planning'], dueDate: iso(dayOffset(9), 10, 0), isStarred: true }),

  // No due date / someday
  task({ title: 'Read "Deep Work"', priority: 'Someday', energyRequired: 'Low', projectId: 'proj-personal', tags: ['reading'] }),
  task({ title: 'Brainstorm side-project ideas', priority: 'Someday', energyRequired: 'Medium', tags: ['ideas'] }),
  task({ title: 'Tidy the garage', priority: 'Low', energyRequired: 'High', timeEstimate: 120, projectId: 'proj-home', tags: ['chore'] }),
];

// ---------------------------------------------------------------------------
// Completed tasks — spread across ~8 weeks to populate the trend chart,
// heatmap, project donut, insights, weekly goal and streak.
// ---------------------------------------------------------------------------
const doneTitles = [
  'Reviewed a pull request', 'Fixed a flaky test', 'Wrote release notes',
  'Cleared the inbox', 'Deployed a hotfix', 'Updated dependencies',
  'Paired on the API', 'Sketched the dashboard', 'Ran the retro',
  'Answered support tickets', 'Refactored a component', 'Wrote a design doc',
  'Merged the feature branch', 'Optimized a query', 'Did a code review',
];
const doneProjects = ['proj-launch', 'proj-launch', 'proj-personal', 'proj-learn', 'proj-home', null];
const priorities = ['Critical', 'High', 'Medium', 'Low'];
const energies = ['Low', 'Medium', 'High'];
const doneHours = [8, 9, 10, 11, 14, 16, 20];

const completed = [];
let ci = 0;
for (let d = 56; d >= 0; d -= 1) {
  const date = dayOffset(-d);
  const dow = date.getDay();
  let n = dow >= 1 && dow <= 5 ? (d * 7 + dow) % 3 : d % 4 === 0 ? 1 : 0;
  if (dow === 2) n += 1; // Tuesdays are the productive day
  if (d <= 8) n = Math.max(n, 1); // keep a 9-day streak + an active current week
  for (let k = 0; k < n; k += 1) {
    const hour = doneHours[(ci + (dow < 3 ? 0 : 3)) % doneHours.length]; // lean morning
    completed.push(
      task({
        title: doneTitles[ci % doneTitles.length],
        priority: priorities[ci % priorities.length],
        energyRequired: energies[ci % energies.length],
        projectId: doneProjects[ci % doneProjects.length],
        timeEstimate: [15, 30, 60, 120][ci % 4],
        isCompleted: true,
        completedDate: iso(date, hour, (ci * 11) % 60),
        createdAt: iso(dayOffset(-d - 2)),
      })
    );
    ci += 1;
  }
}

// ---------------------------------------------------------------------------
// Reflections — 8 consecutive days (for the reflection streak + mood trend),
// plus an older one after a gap.
// ---------------------------------------------------------------------------
const reflectionSeed = [
  { mood: 'good', wins: 'Shipped the settings redesign', learnings: 'Small PRs review faster', tomorrow: 'Start the onboarding flow' },
  { mood: 'great', wins: 'Cleared the whole backlog', learnings: 'Timeboxing works for me', tomorrow: 'Deep work on auth' },
  { mood: 'okay', wins: 'Unblocked the deploy', learnings: 'Ask for help sooner', tomorrow: 'Write more tests' },
  { mood: 'good', wins: 'Great pairing session', learnings: 'Explaining clarifies my thinking', tomorrow: 'Design review' },
  { mood: 'meh', wins: 'Survived a meeting-heavy day', learnings: 'Protect the mornings', tomorrow: 'Focus block at 9am' },
  { mood: 'good', wins: 'Fixed the login bug', learnings: 'Reproduce before fixing', tomorrow: 'Refactor auth' },
  { mood: 'great', wins: 'Hit my weekly goal', learnings: 'Momentum compounds', tomorrow: 'Plan Q3' },
  { mood: 'good', wins: 'Solid, steady day', learnings: 'Consistency over intensity', tomorrow: 'Keep the streak' },
];
const reflections = reflectionSeed.map((r, i) => ({
  id: uid('refl'),
  date: dateKey(dayOffset(-(reflectionSeed.length - 1 - i))),
  wins: r.wins,
  learnings: r.learnings,
  tomorrow: r.tomorrow,
  mood: r.mood,
}));
reflections.push({ id: uid('refl'), date: dateKey(dayOffset(-13)), wins: 'Launched the beta', learnings: 'Ship smaller, sooner', tomorrow: 'Rest and recharge', mood: 'great' });

const payload = {
  app: 'Momentum',
  version: '1.1.1',
  exportedAt: now,
  tasks: [...active, ...completed],
  projects,
  reflections,
  streak: {
    currentStreak: 9,
    longestStreak: 18,
    lastCompletedDate: dateKey(BASE),
    startDate: dateKey(dayOffset(-30)),
  },
};

const out = path.join(__dirname, '..', 'momentum-sample-data.json');
fs.writeFileSync(out, JSON.stringify(payload, null, 2));
console.log(
  `Wrote ${out}\n` +
    `  tasks: ${payload.tasks.length} (${active.length} active, ${completed.length} completed)\n` +
    `  projects: ${projects.length}  reflections: ${reflections.length}`
);
