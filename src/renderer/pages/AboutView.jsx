import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import api from '../utils/api';

// Build-time fallback: webpack's DefinePlugin replaces this token with the
// package.json version at compile time (no runtime `process` needed). Used for
// the browser preview; the real app overrides it with app.getVersion().
const BUILD_VERSION = process.env.APP_VERSION || null;

export default function AboutView() {
  // Prefer the running app's real version (Electron's app.getVersion), which
  // always matches the installed/released build. Falls back to the build-time
  // value in the browser preview.
  const [version, setVersion] = useState(BUILD_VERSION);

  useEffect(() => {
    let alive = true;
    if (api.app && api.app.getVersion) {
      api.app
        .getVersion()
        .then((v) => alive && v && setVersion(v))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, []);

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
          Mo<span style={{ color: 'var(--gold-text)' }}>mentum</span>
        </div>
        <div style={{ color: 'var(--text-2)', marginTop: 'var(--sp-2)', fontSize: 'var(--fs-body-lg)' }}>
          Build momentum, achieve goals.
        </div>
        <div style={{ color: 'var(--text-3)', marginTop: 'var(--sp-5)', maxWidth: 420, margin: 'var(--sp-5) auto 0', lineHeight: 1.6 }}>
          A premium, local-first task manager that makes finishing things feel
          good.
        </div>
        <div
          style={{
            marginTop: 'var(--sp-4)',
            display: 'inline-block',
            fontSize: 'var(--fs-small)',
            color: 'var(--gold-text)',
            background: 'var(--gold-soft)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 12px',
          }}
        >
          Version {version || '—'}
        </div>
      </div>
    </div>
  );
}
