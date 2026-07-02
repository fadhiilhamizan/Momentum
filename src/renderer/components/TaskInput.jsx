import { useState, useRef, useId, forwardRef, useImperativeHandle } from 'react';
import cn from 'classnames';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import PrioritySelector from './PrioritySelector';
import EnergySelector from './EnergySelector';
import TimeSelector from './TimeSelector';
import ProjectSelect from './ProjectSelect';

/**
 * Inline task creator. Type a title and press Enter to add. The options row
 * (priority / energy / time / project / due) is revealed on demand to keep the
 * default state clean. `defaults` seeds new tasks (e.g. project from a project
 * view, or energy from the quick bar).
 */
const TaskInput = forwardRef(function TaskInput({ defaults = {} }, ref) {
  const addTask = useTaskStore((s) => s.addTask);
  const allTasks = useTaskStore((s) => s.tasks);
  const listId = useId();
  const suggestions = [...new Set(allTasks.map((t) => t.title))].slice(0, 60);
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [priority, setPriority] = useState(defaults.priority || 'Medium');
  const [energy, setEnergy] = useState(defaults.energyRequired || 'Medium');
  const [time, setTime] = useState(defaults.timeEstimate ?? null);
  const [projectId, setProjectId] = useState(defaults.projectId || null);
  const [dueDate, setDueDate] = useState(defaults.dueDate || null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current && inputRef.current.focus(),
  }));

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const created = await addTask({
      title: trimmed,
      priority,
      energyRequired: energy,
      timeEstimate: time,
      dueDate,
      projectId,
    });
    // Keep the text if saving failed so the user doesn't lose their input.
    if (created) setTitle('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      inputRef.current && inputRef.current.blur();
    }
  };

  return (
    <div className={cn('task-input', { focused })}>
      <div className="task-input-row">
        <span className="plus">
          <Plus size={18} />
        </span>
        <input
          ref={inputRef}
          className="title"
          placeholder="Add a task and press Enter…"
          value={title}
          list={listId}
          autoComplete="off"
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button
          type="button"
          className="icon-btn"
          title={expanded ? 'Hide options' : 'Show options'}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div
          className="task-input-options animate-in"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--sp-3)' }}
        >
          <OptionRow label="Priority">
            <PrioritySelector value={priority} onChange={setPriority} />
          </OptionRow>
          <OptionRow label="Energy">
            <EnergySelector value={energy} onChange={setEnergy} />
          </OptionRow>
          <OptionRow label="Time">
            <TimeSelector value={time} onChange={setTime} />
          </OptionRow>
          <OptionRow label="Project">
            <div style={{ minWidth: 200 }}>
              <ProjectSelect value={projectId} onChange={setProjectId} />
            </div>
          </OptionRow>
          <OptionRow label="Due">
            <input
              type="date"
              className="date-input"
              style={{ width: 200 }}
              value={dueDate ? new Date(dueDate).toISOString().slice(0, 10) : ''}
              onChange={(e) =>
                setDueDate(
                  e.target.value
                    ? new Date(e.target.value + 'T00:00:00').toISOString()
                    : null
                )
              }
            />
          </OptionRow>
        </div>
      )}
    </div>
  );
});

function OptionRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
      <span
        style={{
          width: 64,
          fontSize: 'var(--fs-tiny)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-3)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export default TaskInput;
