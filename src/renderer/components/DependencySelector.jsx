import { X, Link2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { wouldCreateCycle } from '../utils/taskHelpers';

/**
 * Choose the tasks this one is "waiting on". `value` is an array of task ids;
 * `taskId` is the current task (excluded from the options). Completed tasks and
 * ones already chosen are filtered out of the add list.
 */
export default function DependencySelector({ taskId, value = [], onChange }) {
  const tasks = useTaskStore((s) => s.tasks);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const options = tasks.filter(
    (t) =>
      t.id !== taskId &&
      !value.includes(t.id) &&
      !t.isCompleted &&
      !wouldCreateCycle(taskId, t.id, tasks)
  );

  const add = (id) => {
    if (id && !value.includes(id)) onChange([...value, id]);
  };
  const remove = (id) => onChange(value.filter((x) => x !== id));

  return (
    <div className="dep-editor">
      {value.length > 0 && (
        <div className="dep-list">
          {value.map((id) => {
            const t = byId.get(id);
            const done = t && t.isCompleted;
            return (
              <span className={`dep-chip${done ? ' done' : ''}`} key={id}>
                <Link2 size={11} />
                {t ? t.title : 'Unknown task'}
                <button
                  type="button"
                  className="remove"
                  onClick={() => remove(id)}
                  aria-label="Remove dependency"
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <select
        className="select"
        value=""
        onChange={(e) => {
          add(e.target.value);
          e.target.value = '';
        }}
      >
        <option value="">
          {options.length ? 'Add a task to wait on…' : 'No other open tasks'}
        </option>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
    </div>
  );
}
