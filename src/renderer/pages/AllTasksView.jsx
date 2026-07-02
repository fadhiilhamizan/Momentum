import { useMemo, useState } from 'react';
import { ListChecks, GripVertical } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import TaskInput from '../components/TaskInput';
import TaskCard from '../components/TaskCard';
import SortableTaskList from '../components/SortableTaskList';
import EmptyState from '../components/EmptyState';
import { sortTasks } from '../utils/taskHelpers';

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

export default function AllTasksView() {
  const tasks = useTaskStore((s) => s.tasks);
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState('manual');

  const list = useMemo(() => {
    let l = tasks;
    if (status === 'active') l = l.filter((t) => !t.isCompleted);
    else if (status === 'completed') l = l.filter((t) => t.isCompleted);
    return sortTasks(l, sort);
  }, [tasks, status, sort]);

  // Drag-reorder is only meaningful for the active manual list.
  const draggable = sort === 'manual' && status === 'active';

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
          {status === 'completed'
            ? 'Completed tasks will appear here as you finish them.'
            : 'Add a task above to get started.'}
        </EmptyState>
      )}
    </div>
  );
}
