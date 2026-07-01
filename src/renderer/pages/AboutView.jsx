import { Flame } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="view">
      <div className="placeholder" style={{ paddingTop: 'var(--sp-10)' }}>
        <div
          className="brand-mark"
          style={{ width: 56, height: 56, margin: '0 auto var(--sp-4)' }}
        >
          <Flame size={28} />
        </div>
        <div style={{ fontSize: 'var(--fs-display)', fontWeight: 700 }}>
          Mo<span style={{ color: 'var(--gold)' }}>mentum</span>
        </div>
        <div style={{ color: 'var(--text-2)', marginTop: 'var(--sp-2)', fontSize: 'var(--fs-body-lg)' }}>
          Build momentum, achieve goals.
        </div>
        <div style={{ color: 'var(--text-3)', marginTop: 'var(--sp-5)', maxWidth: 420, margin: 'var(--sp-5) auto 0', lineHeight: 1.6 }}>
          A premium, local-first task manager that makes finishing things feel
          good. Version 0.1.0 — Phase 1 foundation.
        </div>
      </div>
    </div>
  );
}
