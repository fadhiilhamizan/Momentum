import { useState } from 'react';
import cn from 'classnames';
import { Check, X, Plus, ListPlus } from 'lucide-react';
import { toDateInputValue, combineDateAndTime, isOverdue } from '../utils/dateHelpers';

let localId = 0;
const newId = () => `st-${Date.now()}-${localId++}`;
const newNode = (title) => ({ id: newId(), title, done: false, dueDate: null, children: [] });

// Immutable tree operations, keyed by id.
function mapTree(nodes, id, fn) {
  return nodes.map((n) =>
    n.id === id ? fn(n) : { ...n, children: mapTree(n.children || [], id, fn) }
  );
}
function removeFromTree(nodes, id) {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeFromTree(n.children || [], id) }));
}
function addChildTo(nodes, parentId, child) {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...(n.children || []), child] }
      : { ...n, children: addChildTo(n.children || [], parentId, child) }
  );
}

function SubtaskRow({ node, depth, patch, remove, addChild }) {
  const overdue =
    !node.done && isOverdue({ isCompleted: false, dueDate: node.dueDate });
  return (
    <>
      <div className={cn('subtask-row', { done: node.done })} style={{ marginLeft: depth * 18 }}>
        <button
          className={cn('subtask-check', { done: node.done })}
          onClick={() => patch(node.id, { done: !node.done })}
          aria-label="Toggle subtask"
        >
          {node.done && <Check size={11} strokeWidth={3} />}
        </button>
        <input
          className="subtask-text"
          value={node.title}
          onChange={(e) => patch(node.id, { title: e.target.value })}
        />
        <input
          type="date"
          className={cn('subtask-date', { overdue })}
          aria-label="Subtask due date"
          value={toDateInputValue(node.dueDate)}
          onChange={(e) =>
            patch(node.id, { dueDate: e.target.value ? combineDateAndTime(e.target.value, '') : null })
          }
        />
        <button
          className="icon-btn subtask-addchild"
          onClick={() => addChild(node.id)}
          title="Add a sub-step"
          aria-label="Add a sub-step"
        >
          <ListPlus size={14} />
        </button>
        <button
          className="icon-btn subtask-remove"
          onClick={() => remove(node.id)}
          title="Remove"
          aria-label="Remove subtask"
        >
          <X size={14} />
        </button>
      </div>
      {(node.children || []).map((child) => (
        <SubtaskRow
          key={child.id}
          node={child}
          depth={depth + 1}
          patch={patch}
          remove={remove}
          addChild={addChild}
        />
      ))}
    </>
  );
}

/** Edit a task's subtask tree. `value` is [{ id, title, done, dueDate?, children? }]. */
export default function SubtaskEditor({ value = [], onChange }) {
  const [draft, setDraft] = useState('');

  const patch = (id, updates) => onChange(mapTree(value, id, (n) => ({ ...n, ...updates })));
  const remove = (id) => onChange(removeFromTree(value, id));
  const addChild = (parentId) => onChange(addChildTo(value, parentId, newNode('')));

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...value, newNode(t)]);
    setDraft('');
  };

  return (
    <div className="subtask-list">
      {value.map((n) => (
        <SubtaskRow key={n.id} node={n} depth={0} patch={patch} remove={remove} addChild={addChild} />
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
