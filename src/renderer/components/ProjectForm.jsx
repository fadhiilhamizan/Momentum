import { useState } from 'react';
import cn from 'classnames';
import Modal from './Modal';
import { useProjectStore } from '../store/projectStore';

export const PROJECT_COLORS = [
  '#d4af37', '#ef5350', '#ff8a65', '#ffb74d', '#66bb6a',
  '#4db6ac', '#64b5f6', '#7986cb', '#ba68c8', '#f06292',
];

/** Create or edit a project. Pass `project` to edit, omit to create. */
export default function ProjectForm({ project, onClose }) {
  const { addProject, updateProject } = useProjectStore();
  const editing = !!project;
  const [name, setName] = useState(project ? project.name : '');
  const [description, setDescription] = useState(project ? project.description || '' : '');
  const [color, setColor] = useState(project ? project.color : PROJECT_COLORS[0]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) await updateProject(project.id, { name: trimmed, description, color });
    else await addProject({ name: trimmed, description, color });
    onClose();
  };

  const footer = (
    <>
      <span />
      <button className="btn btn-primary" onClick={save} disabled={!name.trim()}>
        {editing ? 'Save changes' : 'Create project'}
      </button>
    </>
  );

  return (
    <Modal title={editing ? 'Edit project' : 'New project'} onClose={onClose} footer={footer}>
      <div className="field">
        <span className="field-label">Name</span>
        <input
          className="text-input"
          autoFocus
          placeholder="e.g. Momentum, Fitness, Reading"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </div>
      <div className="field">
        <span className="field-label">Description</span>
        <textarea
          className="textarea"
          placeholder="What is this workspace for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <span className="field-label">Color</span>
        <div className="color-swatches">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              className={cn('color-swatch', { selected: color === c })}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
