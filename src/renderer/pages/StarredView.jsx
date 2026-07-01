import { Star } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import { sortTasks } from '../utils/taskHelpers';

export default function StarredView() {
  const tasks = useTaskStore((s) => s.tasks);
  const starred = sortTasks(
    tasks.filter((t) => t.isStarred && !t.isCompleted),
    'priority'
  );

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">Starred</div>
        <div className="view-subtitle">Your quick-access favorites</div>
      </div>

      {starred.length > 0 ? (
        <div className="task-list">
          {starred.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Star size={26} />} title="No starred tasks">
          Tap the star on any task to pin it here for quick access.
        </EmptyState>
      )}
    </div>
  );
}
