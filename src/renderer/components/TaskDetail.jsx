import { useState, useEffect } from 'react';
import { Trash2, Repeat } from 'lucide-react';
import Modal from './Modal';
import PrioritySelector from './PrioritySelector';
import EnergySelector from './EnergySelector';
import TimeSelector from './TimeSelector';
import ProjectSelect from './ProjectSelect';
import TagEditor from './TagEditor';
import SubtaskEditor from './SubtaskEditor';
import { useTaskStore } from '../store/taskStore';
import { useUiStore } from '../store/uiStore';
import { BEST_TIMES } from '../utils/taskHelpers';
import { RECURRENCE_OPTIONS } from '../utils/recurrence';

/** Convert an ISO datetime to the yyyy-MM-dd value an <input type=date> wants. */
function toDateValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function Field({ label, children }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}

export default function TaskDetail() {
  const openTaskId = useUiStore((s) => s.openTaskId);
  const closeTask = useUiStore((s) => s.closeTask);
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === openTaskId));
  const { updateTask, deleteTask } = useTaskStore();

  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description || '' : '');

  // Re-sync the text fields whenever a different task is opened.
  useEffect(() => {
    setTitle(task ? task.title : '');
    setDescription(task ? task.description || '' : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTaskId]);

  if (!task) return null;

  const set = (patch) => updateTask(task.id, patch);

  const footer = (
    <>
      <button
        className="btn btn-ghost"
        onClick={() => {
          deleteTask(task.id);
          closeTask();
        }}
      >
        <Trash2 size={15} /> Delete
      </button>
      <button className="btn btn-primary" onClick={closeTask}>
        Done
      </button>
    </>
  );

  return (
    <Modal title="Task details" onClose={closeTask} footer={footer}>
      <Field label="Title">
        <input
          className="text-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && set({ title: title.trim() })}
        />
      </Field>

      <Field label="Notes">
        <textarea
          className="textarea"
          placeholder="Add details, context, links…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => set({ description })}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
        <Field label="Project">
          <ProjectSelect
            value={task.projectId}
            onChange={(projectId) => set({ projectId })}
          />
        </Field>
        <Field label="Due date">
          <input
            type="date"
            className="date-input"
            value={toDateValue(task.dueDate)}
            onChange={(e) =>
              set({
                dueDate: e.target.value
                  ? new Date(e.target.value + 'T00:00:00').toISOString()
                  : null,
              })
            }
          />
        </Field>
      </div>

      <Field label="Priority">
        <PrioritySelector value={task.priority} onChange={(v) => set({ priority: v })} />
      </Field>

      <Field label="Energy required">
        <EnergySelector value={task.energyRequired} onChange={(v) => set({ energyRequired: v })} />
      </Field>

      <Field label="Time estimate">
        <TimeSelector value={task.timeEstimate} onChange={(v) => set({ timeEstimate: v })} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
        <Field label="Best time">
          <select
            className="select"
            value={task.bestTime || 'Anytime'}
            onChange={(e) => set({ bestTime: e.target.value })}
          >
            {BEST_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Repeat">
          <select
            className="select"
            value={task.recurrencePattern || ''}
            onChange={(e) =>
              set({
                recurrencePattern: e.target.value || null,
                isRecurring: !!e.target.value,
              })
            }
          >
            {RECURRENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {task.isRecurring && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: 'var(--gold-text)', fontSize: 'var(--fs-small)', marginTop: 'calc(-1 * var(--sp-2))' }}>
          <Repeat size={13} /> Completing this task schedules the next one automatically.
        </div>
      )}

      <Field label="Tags">
        <TagEditor value={task.tags} onChange={(tags) => set({ tags })} />
      </Field>

      <Field label="Subtasks">
        <SubtaskEditor value={task.subtasks} onChange={(subtasks) => set({ subtasks })} />
      </Field>
    </Modal>
  );
}
