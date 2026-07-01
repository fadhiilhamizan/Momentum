import { useMemo, useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import EmptyState from '../components/EmptyState';

export default function ProjectsView() {
  const projects = useProjectStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.projectId) continue;
      const c = (map[t.projectId] = map[t.projectId] || { total: 0, done: 0 });
      c.total += 1;
      if (t.isCompleted) c.done += 1;
    }
    return map;
  }, [tasks]);

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">Projects</div>
        <div className="view-subtitle">
          Separate workspaces for the different areas of your life
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban size={26} />} title="No projects yet">
          Group related tasks into projects to track progress at a glance.
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={15} /> New project
            </button>
          </div>
        </EmptyState>
      ) : (
        <div className="project-grid">
          {projects.map((p) => {
            const c = counts[p.id] || { total: 0, done: 0 };
            return <ProjectCard key={p.id} project={p} total={c.total} done={c.done} />;
          })}
          <button className="project-card project-add-card" onClick={() => setCreating(true)}>
            <Plus size={24} />
            New project
          </button>
        </div>
      )}

      {creating && <ProjectForm onClose={() => setCreating(false)} />}
    </div>
  );
}
