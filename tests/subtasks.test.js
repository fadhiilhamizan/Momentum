import { describe, it, expect } from 'vitest';
import { flattenSubtasks, subtaskProgress, resetSubtasks } from '../src/shared/subtasks.js';

const tree = () => [
  {
    id: 'a',
    title: 'A',
    done: true,
    children: [
      { id: 'a1', title: 'A1', done: false, children: [] },
      { id: 'a2', title: 'A2', done: true },
    ],
  },
  { id: 'b', title: 'B', done: false },
];

describe('flattenSubtasks', () => {
  it('flattens the tree depth-first', () => {
    expect(flattenSubtasks(tree()).map((n) => n.id)).toEqual(['a', 'a1', 'a2', 'b']);
  });

  it('handles empty / undefined input', () => {
    expect(flattenSubtasks()).toEqual([]);
    expect(flattenSubtasks([])).toEqual([]);
  });
});

describe('subtaskProgress', () => {
  it('counts done/total across the whole tree', () => {
    expect(subtaskProgress(tree())).toEqual({ done: 2, total: 4 });
  });

  it('ignores empty-title placeholder rows', () => {
    const t = [
      { id: 'x', title: '  ', done: false },
      { id: 'y', title: 'Y', done: true },
    ];
    expect(subtaskProgress(t)).toEqual({ done: 1, total: 1 });
  });
});

describe('resetSubtasks', () => {
  it('recursively clears done while preserving structure', () => {
    const reset = resetSubtasks(tree());
    expect(flattenSubtasks(reset).every((n) => n.done === false)).toBe(true);
    expect(reset[0].children[0].id).toBe('a1');
  });

  it('does not mutate the input', () => {
    const input = tree();
    resetSubtasks(input);
    expect(input[0].done).toBe(true);
    expect(input[0].children[1].done).toBe(true);
  });
});
