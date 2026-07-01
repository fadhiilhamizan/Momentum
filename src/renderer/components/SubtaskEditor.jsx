import { useState } from 'react';
import cn from 'classnames';
import { Check, X, Plus } from 'lucide-react';

let localId = 0;
const newId = () => `st-${Date.now()}-${localId++}`;

/** Edit a task's subtasks. `value` is [{ id, title, done }]. */
export default function SubtaskEditor({ value = [], onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...value, { id: newId(), title: t, done: false }]);
    setDraft('');
  };

  const patch = (id, updates) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...updates } : s)));

  const remove = (id) => onChange(value.filter((s) => s.id !== id));

  return (
    <div className="subtask-list">
      {value.map((s) => (
        <div key={s.id} className={cn('subtask-row', { done: s.done })}>
          <button
            className={cn('subtask-check', { done: s.done })}
            onClick={() => patch(s.id, { done: !s.done })}
            aria-label="Toggle subtask"
          >
            {s.done && <Check size={11} strokeWidth={3} />}
          </button>
          <input
            className="subtask-text"
            value={s.title}
            onChange={(e) => patch(s.id, { title: e.target.value })}
          />
          <button
            className="icon-btn subtask-remove"
            onClick={() => remove(s.id)}
            aria-label="Remove subtask"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="subtask-row">
        <span className="subtask-check" style={{ borderStyle: 'dashed' }}>
          <Plus size={11} />
        </span>
        <input
          className="subtask-text"
          placeholder="Add a subtask…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      </div>
    </div>
  );
}
