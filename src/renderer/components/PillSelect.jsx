import cn from 'classnames';

/**
 * A compact row of selectable pills. Used for priority, energy, time and
 * best-time selection. `options` is [{ value, label, color? }].
 */
export default function PillSelect({ options, value, onChange, allowClear }) {
  return (
    <div className="selector-group">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            className={cn('pill', { selected })}
            onClick={() => onChange(allowClear && selected ? null : opt.value)}
          >
            {opt.color && (
              <span className="dot" style={{ background: opt.color }} />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
