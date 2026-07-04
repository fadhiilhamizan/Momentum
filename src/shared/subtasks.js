// @ts-check
/**
 * subtasks.js — pure helpers for the (nestable) subtask tree. Shared by the
 * renderer (progress, editing) and the data layer (resetting on recurrence).
 * @typedef {import('../types').Subtask} Subtask
 */

/**
 * Flatten a subtask tree depth-first into a single array.
 * @param {Subtask[]} [nodes]
 * @returns {Subtask[]}
 */
export function flattenSubtasks(nodes = []) {
  const out = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children && n.children.length) out.push(...flattenSubtasks(n.children));
  }
  return out;
}

/**
 * Done/total counts across the whole tree.
 * @param {Subtask[]} [nodes]
 * @returns {{ done: number, total: number }}
 */
export function subtaskProgress(nodes = []) {
  const all = flattenSubtasks(nodes).filter((n) => n.title && n.title.trim());
  return { done: all.filter((n) => n.done).length, total: all.length };
}

/**
 * A copy of the tree with every node's `done` reset — used when a recurring
 * task spawns its next occurrence.
 * @param {Subtask[]} [nodes]
 * @returns {Subtask[]}
 */
export function resetSubtasks(nodes = []) {
  return nodes.map((n) => ({
    ...n,
    done: false,
    children: n.children ? resetSubtasks(n.children) : n.children,
  }));
}
