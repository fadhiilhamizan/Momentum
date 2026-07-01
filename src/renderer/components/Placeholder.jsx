export default function Placeholder({ phase, title, subtitle, children }) {
  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">{title}</div>
        {subtitle && <div className="view-subtitle">{subtitle}</div>}
      </div>
      <div className="placeholder">
        {phase && <div className="badge">{phase}</div>}
        <div style={{ maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
