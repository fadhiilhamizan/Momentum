import { useProjectStore } from '../store/projectStore';

/** A styled native select for choosing a project (or none). */
export default function ProjectSelect({ value, onChange }) {
  const projects = useProjectStore((s) => s.projects);
  return (
    <select
      className="select"
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">No project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
