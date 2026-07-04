import { describe, it, expect } from 'vitest';
import {
  priorityRank, timeLabel, groupByEnergy, suggestForBudget, sortTasks,
  blockingTasks, isBlocked, dependsOnTransitively, wouldCreateCycle,
} from '../src/renderer/utils/taskHelpers.js';

const task = (o) => ({
  id: 'x', title: 't', priority: 'Medium', energyRequired: 'Medium',
  timeEstimate: null, isCompleted: false, dependsOn: [], createdAt: '2026-01-01', sortOrder: 0, ...o,
});

describe('priorityRank', () => {
  it('ranks Critical highest and unknowns last', () => {
    expect(priorityRank('Critical')).toBe(0);
    expect(priorityRank('High')).toBe(1);
    expect(priorityRank('Someday')).toBe(4);
    expect(priorityRank('???')).toBe(5);
  });
});

describe('timeLabel', () => {
  it('formats known and unknown estimates', () => {
    expect(timeLabel(15)).toBe('15 min');
    expect(timeLabel(45)).toBe('45 min');
    expect(timeLabel(null)).toBe(null);
  });
});

describe('groupByEnergy', () => {
  it('groups High > Medium > Low and drops empty groups', () => {
    const groups = groupByEnergy([
      task({ id: 'a', energyRequired: 'Low' }),
      task({ id: 'b', energyRequired: 'High' }),
      task({ id: 'c', energyRequired: 'High' }),
    ]);
    expect(groups.map((g) => g.level)).toEqual(['High', 'Low']);
    expect(groups[0].tasks).toHaveLength(2);
  });
});

describe('suggestForBudget', () => {
  it('returns up to 3 incomplete tasks within budget, priority first', () => {
    const list = [
      task({ id: 'a', timeEstimate: 60, priority: 'Low' }),
      task({ id: 'b', timeEstimate: 15, priority: 'Critical' }),
      task({ id: 'c', timeEstimate: 120, priority: 'High' }), // over budget
      task({ id: 'd', timeEstimate: 15, isCompleted: true }), // done
    ];
    const out = suggestForBudget(list, 30);
    expect(out.map((t) => t.id)).toEqual(['b']);
  });
});

describe('sortTasks', () => {
  it('sorts by priority', () => {
    const out = sortTasks([task({ id: 'a', priority: 'Low' }), task({ id: 'b', priority: 'Critical' })], 'priority');
    expect(out.map((t) => t.id)).toEqual(['b', 'a']);
  });
  it('sorts by due date (undated last)', () => {
    const out = sortTasks([
      task({ id: 'a', dueDate: null }),
      task({ id: 'b', dueDate: '2026-07-01' }),
    ], 'due');
    expect(out.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('dependencies', () => {
  const foundation = task({ id: 'f', title: 'Foundation' });
  const build = task({ id: 'b', title: 'Build', dependsOn: ['f'] });
  const ship = task({ id: 's', title: 'Ship', dependsOn: ['b'] });
  const all = [foundation, build, ship];

  it('isBlocked/blockingTasks reflect incomplete dependencies', () => {
    expect(isBlocked(build, all)).toBe(true);
    expect(blockingTasks(build, all).map((t) => t.title)).toEqual(['Foundation']);
    expect(isBlocked(foundation, all)).toBe(false);
  });

  it('a completed dependency no longer blocks', () => {
    const done = [{ ...foundation, isCompleted: true }, build];
    expect(isBlocked(build, done)).toBe(false);
  });

  it('dependsOnTransitively walks the chain', () => {
    const byId = new Map(all.map((t) => [t.id, t]));
    expect(dependsOnTransitively('s', 'f', byId)).toBe(true); // ship -> build -> foundation
    expect(dependsOnTransitively('f', 's', byId)).toBe(false);
  });

  it('wouldCreateCycle blocks self and back-references', () => {
    expect(wouldCreateCycle('f', 'f', all)).toBe(true); // self
    expect(wouldCreateCycle('f', 's', all)).toBe(true); // ship already depends on foundation
    expect(wouldCreateCycle('f', 'b', all)).toBe(true); // build already depends on foundation
  });
});
