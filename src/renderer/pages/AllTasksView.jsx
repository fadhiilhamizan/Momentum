import { useMemo, useState } from 'react';
import { ListChecks, GripVertical } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import TaskInput from '../components/TaskInput';
import TaskCard from '../components/TaskCard';
import SortableTaskList from '../components/SortableTaskList';
import EmptyState from '../components/EmptyState';
import { sortTasks, PRIORITIES, ENERGY_LEVELS } from '../utils/taskHelpers';

const STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];
const SORTS = [
  { value: 'manual', label: 'Manual' },
  { value: 'priority', label: 'Priority' },
  { value: 'due', label: 'Due date' },
  { value: 'created', label: 'Recent' },
  { value: 'energy', label: 'Energy' },
];

const NO_PROJECT = '__none__';

export default function AllTasksView() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useProjectStore((s) => s.projects);
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState('manual');
  const [priority, setPriority] = useState('all');
  const [energy, setEnergy] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [tag, setTag] = useState('all');

  // Every distinct tag currently in use, for the tag filter.
  const allTags = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => (t.tags || []).forEach((tg) => set.add(tg)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const anyFilter =
    priority !== 'all' || energy !== 'all' || projectId !== 'all' || tag !== 'all';

  const clearFilters = () => {
    setPriority('all');
    setEnergy('all');
    setProjectId('all');
    setTag('all');
  };

  const list = useMemo(() => {
    let l = tasks;
    if (status === 'active') l = l.filter((t) => !t.isCompleted);
    else if (status === 'completed') l = l.filter((t) => t.isCompleted);
    if (priority !== 'all') l = l.filter((t) => t.priority === priority);
    if (energy !== 'all') l = l.filter((t) => t.energyRequired === energy);
    if (projectId !== 'all')
      l = l.filter((t) =>
        projectId === NO_PROJECT ? !t.projectId : t.projectId === projectId
      );
    if (tag !== 'all') l = l.filter((t) => (t.tags || []).includes(tag));
    return sortTasks(l, sort);
  }, [tasks, status, sort, priority, energy, projectId, tag]);

  // Drag-reorder is only meaningful for the unfiltered active manual list.
  const draggable = sort === 'manual' && status === 'active' && !anyFilter;

  const selectStyle = { width: 'auto', minWidth: 120, padding: '6px 28px 6px 10px' };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">All Tasks</div>
        <div className="view-subtitle">
          Everything in one place — {tasks.filter((t) => !t.isCompleted).length}{' '}
          active
        </div>
      </div>

      <div
        className="quick-bar"
        style={{ justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <span className="label">Show</span>
          {STATUS.map((s) => (
            <button
              key={s.value}
              className={`pill${status === s.value ? ' selected' : ''}`}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <span className="label">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.value}
              className={`pill${sort === s.value ? ' selected' : ''}`}
              onClick={() => setSort(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="quick-bar" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <span className="label">Filter</span>
        <select
          className="select"
          style={selectStyle}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="all">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className="select"
          style={selectStyle}
          value={energy}
          onChange={(e) => setEnergy(e.target.value)}
          aria-label="Filter by energy"
        >
          <option value="all">Any energy</option>
          {ENERGY_LEVELS.map((en) => (
            <option key={en.value} value={en.value}>
              {en.label}
            </option>
          ))}
        </select>
        <select
          className="select"
          style={selectStyle}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Filter by project"
        >
          <option value="all">Any project</option>
          <option value={NO_PROJECT}>No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select
            className="select"
            style={selectStyle}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="Filter by tag"
          >
            <option value="all">Any tag</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}
        {anyFilter && (
          <button className="btn btn-ghost" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <TaskInput />

      {draggable && list.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 'var(--fs-tiny)', margin: '0 0 var(--sp-2) 2px' }}>
          <GripVertical size={12} /> Drag the handle to reorder
        </div>
      )}
      {list.length > 0 ? (
        draggable ? (
          <SortableTaskList tasks={list} />
        ) : (
          <div className="task-list">
            {list.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )
      ) : (
        <EmptyState icon={<ListChecks size={26} />} title="Nothing here yet">
          {anyFilter
            ? 'No tasks match these filters. Try clearing them.'
            : status === 'completed'
            ? 'Completed tasks will appear here as you finish them.'
            : 'Add a task above to get started.'}
        </EmptyState>
      )}
    </div>
  );
}
