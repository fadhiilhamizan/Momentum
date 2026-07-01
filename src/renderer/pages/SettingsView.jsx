import { Moon, Sun, Shield, Database } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { isElectron } from '../utils/api';

function Section({ title, children }) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--sp-5)',
        marginBottom: 'var(--sp-4)',
      }}
    >
      <div style={{ fontSize: 'var(--fs-h3)', fontWeight: 600, marginBottom: 'var(--sp-3)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function SettingsView() {
  const theme = useUserStore((s) => s.settings.theme || 'dark');
  const setSetting = useUserStore((s) => s.setSetting);

  const setTheme = (value) => {
    setSetting('theme', value);
    document.documentElement.setAttribute('data-theme', value);
  };

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">Settings</div>
        <div className="view-subtitle">Make Momentum yours</div>
      </div>

      <Section title="Appearance">
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button
            className={`pill${theme === 'dark' ? ' selected' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={13} /> Dark
          </button>
          <button
            className={`pill${theme === 'light' ? ' selected' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={13} /> Light
          </button>
        </div>
      </Section>

      <Section title="Privacy & Data">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', color: 'var(--text-2)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5 }}>
          <Shield size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            Everything stays on your device. Momentum stores all data locally
            {isElectron ? ' in a private SQLite database.' : ' in your browser.'}
            {' '}No accounts, no cloud, no tracking.
          </div>
        </div>
      </Section>

      <Section title="Storage engine">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', color: 'var(--text-2)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5 }}>
          <Database size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            {isElectron
              ? 'SQLite (WebAssembly build) — no native compilation required.'
              : 'Browser localStorage (preview mode). Launch the desktop app for the full SQLite database.'}
          </div>
        </div>
      </Section>
    </div>
  );
}
