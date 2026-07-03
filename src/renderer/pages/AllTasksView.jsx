import { useMemo, useState } from 'react';
import { ListChecks, GripVertical, CheckSquare, Check, Trash2 } from 'lucide-react';
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
  const bulkComplete = useTaskStore((s) => s.bulkComplete);
  const bulkDelete = useTaskStore((s) => s.bulkDelete);
  const bulkUpdate = useTaskStore((s) => s.bulkUpdate);
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState('manual');
  const [priority, setPriority] = useState('all');
  const [energy, setEnergy] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [tag, setTag] = useState('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

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

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
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
  const draggable = sort === 'manual' && status === 'active' && !anyFilter && !selectionMode;

  const chosenIds = [...selectedIds];
  const selectAll = () => setSelectedIds(new Set(list.map((t) => t.id)));
  const runBulk = (fn) => {
    if (chosenIds.length) fn(chosenIds);
    exitSelection();
  };
  const moveToProject = (val) => {
    if (val === '') return;
    runBulk((ids) => bulkUpdate(ids, { projectId: val === NO_PROJECT ? null : val }));
  };

  const selectStyle = { width: 'auto', minWidth: 120, padding: '6px 28px 6px 10px' };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">All Tasks</div>
        <div className="view-subtitle">
          Everything in one place · {tasks.filter((t) => !t.isCompleted).length}{' '}
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
        <button
          className="btn btn-ghost"
          style={{ marginLeft: 'auto' }}
          onClick={() => (selectionMode ? exitSelection() : setSelectionMode(true))}
        >
          <CheckSquare size={15} /> {selectionMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      {selectionMode && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectedIds.size} selected</span>
          <button className="btn btn-ghost" onClick={selectAll}>
            Select all
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setSelectedIds(new Set())}
            disabled={!selectedIds.size}
          >
            Clear
          </button>
          <span style={{ flex: 1 }} />
          <button
            className="btn btn-ghost"
            disabled={!selectedIds.size}
            onClick={() => runBulk(bulkComplete)}
          >
            <Check size={15} /> Complete
          </button>
          <select
            className="select"
            style={{ width: 'auto' }}
            value=""
            onChange={(e) => moveToProject(e.target.value)}
            disabled={!selectedIds.size}
            aria-label="Move selected to project"
          >
            <option value="">Move to project…</option>
            <option value={NO_PROJECT}>No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost"
            style={{ color: 'var(--priority-critical)' }}
            disabled={!selectedIds.size}
            onClick={() => runBulk(bulkDelete)}
          >
            <Trash2 size={15} /> Delete
          </button>
          <button className="btn btn-primary" onClick={exitSelection}>
            Done
          </button>
        </div>
      )}

      {!selectionMode && <TaskInput />}

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
              <TaskCard
                key={t.id}
                task={t}
                selectionMode={selectionMode}
                selected={selectedIds.has(t.id)}
                onToggleSelect={toggleSelect}
              />
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
