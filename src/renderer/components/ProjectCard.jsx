import { useNavigate } from 'react-router-dom';
import cn from 'classnames';
import { Star } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import ProgressRing from './ProgressRing';

export default function ProjectCard({ project, total, done }) {
  const navigate = useNavigate();
  const updateProject = useProjectStore((s) => s.updateProject);
  const pct = total > 0 ? done / total : 0;
  const remaining = total - done;

  return (
    <div className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
      <div className="project-card-head">
        <span className="project-swatch" style={{ background: project.color }} />
        <div className="project-name">{project.name}</div>
        <button
          className={cn('project-fav', { on: project.isFavorite })}
          onClick={(e) => {
            e.stopPropagation();
            updateProject(project.id, { isFavorite: !project.isFavorite });
          }}
          title={project.isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star size={16} fill={project.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {project.description && <div className="project-desc">{project.description}</div>}

      <div className="project-foot">
        <div className="project-count">
          {total === 0
            ? 'No tasks yet'
            : remaining === 0
            ? 'All done 🎉'
            : `${remaining} of ${total} left`}
        </div>
        <ProgressRing value={pct} size={44} stroke={4}>
          {Math.round(pct * 100)}
        </ProgressRing>
      </div>
    </div>
  );
}
