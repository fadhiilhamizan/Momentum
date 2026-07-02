import { useState, useRef, useId, forwardRef, useImperativeHandle } from 'react';
import cn from 'classnames';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import PrioritySelector from './PrioritySelector';
import EnergySelector from './EnergySelector';
import TimeSelector from './TimeSelector';
import ProjectSelect from './ProjectSelect';
import TagEditor from './TagEditor';
import SubtaskEditor from './SubtaskEditor';
import { BEST_TIMES } from '../utils/taskHelpers';
import { RECURRENCE_OPTIONS } from '../utils/recurrence';
import {
  todayKey, toDateInputValue, toTimeInputValue, combineDateAndTime,
} from '../utils/dateHelpers';

/**
 * Inline task creator. Type a title and press Enter to add. The options row
 * (priority / energy / time / project / due) is revealed on demand, and an
 * "Advanced" panel exposes the same deeper fields as the task-detail modal
 * (notes / best time / repeat / tags / subtasks) so a task can be fully
 * specified at creation time. `defaults` seeds new tasks (e.g. project from a
 * project view, or energy from the quick bar).
 */
const TaskInput = forwardRef(function TaskInput({ defaults = {} }, ref) {
  const addTask = useTaskStore((s) => s.addTask);
  const allTasks = useTaskStore((s) => s.tasks);
  const listId = useId();
  const suggestions = [...new Set(allTasks.map((t) => t.title))].slice(0, 60);
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [priority, setPriority] = useState(defaults.priority || 'Medium');
  const [energy, setEnergy] = useState(defaults.energyRequired || 'Medium');
  const [time, setTime] = useState(defaults.timeEstimate ?? null);
  const [projectId, setProjectId] = useState(defaults.projectId || null);
  const [dueDate, setDueDate] = useState(defaults.dueDate || null);
  const [description, setDescription] = useState('');
  const [bestTime, setBestTime] = useState(defaults.bestTime || 'Anytime');
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [tags, setTags] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
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
      description: description.trim() || null,
      bestTime,
      recurrencePattern: recurrencePattern || null,
      isRecurring: !!recurrencePattern,
      tags,
      subtasks,
    });
    // Keep the text if saving failed so the user doesn't lose their input.
    // On success, clear the per-task content but keep the classification
    // settings so several similar tasks can be added in a row.
    if (created) {
      setTitle('');
      setDescription('');
      setTags([]);
      setSubtasks([]);
    }
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
        <button
          type="button"
          className="plus"
          onClick={submit}
          title="Add task"
          aria-label="Add task"
        >
          <Plus size={18} />
        </button>
        <input
          ref={inputRef}
          className="title"
          placeholder="Add a task and press Enter…"
          value={title}
          list={listId}
          autoComplete="off"
          aria-required="true"
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setExpanded(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <span className="task-required" title="A title is required">
          *
        </span>
        <button
          type="button"
          className="icon-btn"
          title={expanded ? 'Hide options' : 'Show options'}
          aria-label={expanded ? 'Hide options' : 'Show options'}
          aria-expanded={expanded}
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
          <div className="task-input-optnote">
            <span className="task-required">*</span> Only a title is required. Everything
            below is optional.
          </div>
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
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
              <input
                type="date"
                className="date-input"
                style={{ width: 160 }}
                aria-label="Due date"
                value={toDateInputValue(dueDate)}
                onChange={(e) =>
                  setDueDate(combineDateAndTime(e.target.value, toTimeInputValue(dueDate)))
                }
              />
              <input
                type="time"
                className="date-input"
                style={{ width: 130 }}
                aria-label="Due time (optional)"
                value={toTimeInputValue(dueDate)}
                onChange={(e) => {
                  // A time on its own defaults the date to today.
                  const dateStr = toDateInputValue(dueDate) || (e.target.value ? todayKey() : '');
                  setDueDate(combineDateAndTime(dateStr, e.target.value));
                }}
              />
            </div>
          </OptionRow>

          <div className="task-input-advanced">
            <button
              type="button"
              className="task-adv-toggle"
              aria-expanded={advanced}
              onClick={() => setAdvanced((v) => !v)}
            >
              {advanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Advanced
            </button>

            {advanced && (
              <div
                className="animate-in"
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', marginTop: 'var(--sp-3)' }}
              >
                <StackedField label="Notes">
                  <textarea
                    className="textarea"
                    placeholder="Add details, context, links…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </StackedField>
                <StackedField label="Best time">
                  <select
                    className="select"
                    value={bestTime}
                    onChange={(e) => setBestTime(e.target.value)}
                  >
                    {BEST_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </StackedField>
                <StackedField label="Repeat">
                  <select
                    className="select"
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value)}
                  >
                    {RECURRENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </StackedField>
                <StackedField label="Tags">
                  <TagEditor value={tags} onChange={setTags} />
                </StackedField>
                <StackedField label="Subtasks">
                  <SubtaskEditor value={subtasks} onChange={setSubtasks} />
                </StackedField>
              </div>
            )}
          </div>
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

function StackedField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <span
        style={{
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
