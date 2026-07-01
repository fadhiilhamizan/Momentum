/**
 * Heatmap — GitHub-style contribution grid. `data` is the output of
 * analyticsHelpers.heatmap(): { columns, max, weekdays }.
 */
const LEVEL_COLORS = [
  'var(--surface-2)',
  'rgba(212, 175, 55, 0.28)',
  'rgba(212, 175, 55, 0.5)',
  'rgba(212, 175, 55, 0.75)',
  'var(--gold)',
];

function levelFor(count, max) {
  if (!count) return 0;
  if (max <= 1) return 4;
  return Math.min(4, Math.ceil((count / max) * 4));
}

export default function Heatmap({ data }) {
  const { columns, max, weekdays } = data;
  return (
    <div>
      <div className="heatmap-wrap">
        <div className="heatmap-weekdays">
          {weekdays.map((d, i) => (
            <span key={d}>{i % 2 === 1 ? d : ''}</span>
          ))}
        </div>
        <div className="heatmap">
          {columns.map((col, ci) => (
            <div className="heatmap-col" key={ci}>
              {col.cells.map((cell, ri) => (
                <div
                  key={ri}
                  className="heatmap-cell"
                  style={{
                    background: cell
                      ? LEVEL_COLORS[levelFor(cell.count, max)]
                      : 'transparent',
                  }}
                  title={
                    cell
                      ? `${cell.count} completed · ${cell.label}`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        Less
        {LEVEL_COLORS.map((c) => (
          <span
            key={c}
            className="heatmap-cell"
            style={{ background: c, width: 11, height: 11 }}
          />
        ))}
        More
      </div>
    </div>
  );
}
