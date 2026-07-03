/** taskHelpers.js — shared task metadata: option lists, colors, grouping. */

export const PRIORITIES = [
  { value: 'Critical', label: 'Critical', color: 'var(--priority-critical)' },
  { value: 'High', label: 'High', color: 'var(--priority-high)' },
  { value: 'Medium', label: 'Medium', color: 'var(--priority-medium)' },
  { value: 'Low', label: 'Low', color: 'var(--priority-low)' },
  { value: 'Someday', label: 'Someday', color: 'var(--priority-someday)' },
];

export const ENERGY_LEVELS = [
  { value: 'Low', label: 'Low energy' },
  { value: 'Medium', label: 'Medium energy' },
  { value: 'High', label: 'High energy' },
];

export const TIME_ESTIMATES = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2+ hrs' },
];

export const BEST_TIMES = ['Morning', 'Afternoon', 'Evening', 'Anytime'];

export function priorityColor(priority) {
  const p = PRIORITIES.find((x) => x.value === priority);
  return p ? p.color : 'var(--text-3)';
}

export function priorityRank(priority) {
  const order = ['Critical', 'High', 'Medium', 'Low', 'Someday'];
  const i = order.indexOf(priority);
  return i === -1 ? order.length : i;
}

export function timeLabel(minutes) {
  if (minutes == null) return null;
  const t = TIME_ESTIMATES.find((x) => x.value === minutes);
  return t ? t.label : `${minutes} min`;
}

/** Group tasks by required energy level, preserving High > Medium > Low order. */
export function groupByEnergy(tasks) {
  const groups = { High: [], Medium: [], Low: [] };
  tasks.forEach((t) => {
    const key = groups[t.energyRequired] ? t.energyRequired : 'Medium';
    groups[key].push(t);
  });
  return ['High', 'Medium', 'Low']
    .map((level) => ({ level, tasks: groups[level] }))
    .filter((g) => g.tasks.length > 0);
}

/** Suggest tasks doable within a time budget, cheapest-fitting first. */
export function suggestForBudget(tasks, minutes) {
  return tasks
    .filter((t) => !t.isCompleted)
    .filter((t) => (t.timeEstimate ?? 30) <= minutes)
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 3);
}

/** Tasks this one is "waiting on" that aren't finished yet. `all` is the list. */
export function blockingTasks(task, all) {
  const deps = task.dependsOn || [];
  if (!deps.length) return [];
  const byId = new Map(all.map((t) => [t.id, t]));
  return deps.map((id) => byId.get(id)).filter((t) => t && !t.isCompleted);
}

/** True when a task is blocked by at least one unfinished dependency. */
export function isBlocked(task, all) {
  return blockingTasks(task, all).length > 0;
}

/** Does `taskId` depend on `targetId`, directly or transitively? */
export function dependsOnTransitively(taskId, targetId, byId, seen = new Set()) {
  if (seen.has(taskId)) return false;
  seen.add(taskId);
  const t = byId.get(taskId);
  if (!t) return false;
  const deps = t.dependsOn || [];
  if (deps.includes(targetId)) return true;
  return deps.some((d) => dependsOnTransitively(d, targetId, byId, seen));
}

/** Would making `taskId` wait on `candidateId` create a dependency cycle? */
export function wouldCreateCycle(taskId, candidateId, all) {
  if (taskId === candidateId) return true;
  const byId = new Map(all.map((t) => [t.id, t]));
  // A cycle forms if the candidate already (transitively) depends on this task.
  return dependsOnTransitively(candidateId, taskId, byId);
}

export function sortTasks(tasks, by = 'priority') {
  const copy = [...tasks];
  switch (by) {
    case 'manual':
      return copy.sort(
        (a, b) =>
          (a.sortOrder || 0) - (b.sortOrder || 0) ||
          (b.createdAt || '').localeCompare(a.createdAt || '')
      );
    case 'priority':
      return copy.sort(
        (a, b) => priorityRank(a.priority) - priorityRank(b.priority)
      );
    case 'due':
      return copy.sort((a, b) => (a.dueDate || '~').localeCompare(b.dueDate || '~'));
    case 'created':
      return copy.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    case 'energy': {
      const rank = { High: 0, Medium: 1, Low: 2 };
      return copy.sort((a, b) => rank[a.energyRequired] - rank[b.energyRequired]);
    }
    default:
      return copy;
  }
}
