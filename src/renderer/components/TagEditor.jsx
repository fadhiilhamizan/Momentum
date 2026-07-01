import { useState } from 'react';
import { X, Hash } from 'lucide-react';

/** Add/remove freeform tags. `value` is a string[]. */
export default function TagEditor({ value = [], onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim().replace(/^#/, '');
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };

  return (
    <div className="tag-editor">
      {value.map((tag) => (
        <span className="tag-chip" key={tag}>
          <Hash size={11} />
          {tag}
          <button
            type="button"
            className="remove"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove ${tag}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        className="tag-add"
        placeholder="Add tag…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
          if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
      />
    </div>
  );
}
