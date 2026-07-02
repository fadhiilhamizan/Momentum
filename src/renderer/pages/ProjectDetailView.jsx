import { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import TaskInput from '../components/TaskInput';
import TaskCard from '../components/TaskCard';
import SortableTaskList from '../components/SortableTaskList';
import ProjectForm from '../components/ProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ProgressRing from '../components/ProgressRing';
import EmptyState from '../components/EmptyState';
import { sortTasks } from '../utils/taskHelpers';

export default function ProjectDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const tasks = useTaskStore((s) => s.tasks);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { active, done, pct } = useMemo(() => {
    const mine = tasks.filter((t) => t.projectId === id);
    const active = sortTasks(mine.filter((t) => !t.isCompleted), 'manual');
    const done = mine.filter((t) => t.isCompleted);
    return { active, done, pct: mine.length ? done.length / mine.length : 0 };
  }, [tasks, id]);

  if (!project) return <Navigate to="/projects" replace />;

  return (
    <div className="view">
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 'var(--sp-4)' }}
      >
        <ArrowLeft size={15} /> Projects
      </button>

      <div className="view-head" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <span
          style={{ width: 14, height: 14, borderRadius: 4, background: project.color, flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div className="view-title">{project.name}</div>
          {project.description && <div className="view-subtitle">{project.description}</div>}
        </div>
        <ProgressRing value={pct} size={52} stroke={5}>
          {Math.round(pct * 100)}
        </ProgressRing>
        <button className="icon-btn" onClick={() => setEditing(true)} title="Edit project">
          <Pencil size={16} />
        </button>
        <button className="icon-btn" onClick={() => setConfirming(true)} title="Delete project">
          <Trash2 size={16} />
        </button>
      </div>

      <TaskInput defaults={{ projectId: project.id }} />

      {active.length > 0 ? (
        <SortableTaskList tasks={active} />
      ) : (
        <EmptyState title="No active tasks">
          Add the first task for this project above.
        </EmptyState>
      )}

      {done.length > 0 && (
        <div className="task-group" style={{ marginTop: 'var(--sp-8)' }}>
          <div className="task-group-title">
            Completed <span className="count">· {done.length}</span>
          </div>
          <div className="task-list">
            {done.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {editing && <ProjectForm project={project} onClose={() => setEditing(false)} />}

      {confirming && (
        <ConfirmDialog
          title="Delete project?"
          message={`“${project.name}” will be removed. Its tasks will be kept but unassigned from the project.`}
          confirmLabel="Delete project"
          onConfirm={() => {
            deleteProject(project.id);
            navigate('/projects');
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
