export default function EmptyState({ icon, title, children }) {
  return (
    <div className="empty-state">
      {icon && <div className="emoji">{icon}</div>}
      <h3>{title}</h3>
      {children && <div className="empty-body">{children}</div>}
    </div>
  );
}
