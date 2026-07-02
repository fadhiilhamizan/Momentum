import { useRef } from 'react';
import { Moon, Sun, Shield, Database, Volume2, VolumeX, Download, Upload, Bell, BellOff } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import api, { isElectron } from '../utils/api';
import { playChime } from '../utils/sound';
import { todayKey } from '../utils/dateHelpers';
import { useUiStore } from '../store/uiStore';
import { requestPermission, permission, testNotification, supported } from '../utils/notifications';

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
  const sound = useUserStore((s) => s.settings.sound !== false);
  const notifications = useUserStore((s) => s.settings.notifications === true);
  const setSetting = useUserStore((s) => s.setSetting);

  const setTheme = (value) => {
    setSetting('theme', value);
    document.documentElement.setAttribute('data-theme', value);
  };

  const setSound = (value) => {
    setSetting('sound', value);
    if (value) setTimeout(playChime, 0);
  };

  const showToast = useUiStore((s) => s.showToast);
  const reloadTasks = useTaskStore((s) => s.load);
  const reloadProjects = useProjectStore((s) => s.load);
  const fileRef = useRef(null);

  const onImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const counts = await api.data.import(payload);
      await Promise.all([reloadTasks(), reloadProjects()]);
      showToast(
        `Imported ${counts.tasks} tasks · ${counts.projects} projects`,
        'sparkles'
      );
    } catch (err) {
      console.error('Import failed', err);
      showToast("That file couldn't be imported", 'sparkles');
    }
  };

  const setNotifications = async (value) => {
    if (value) {
      const result = await requestPermission();
      if (result !== 'granted') {
        showToast('Notifications were blocked by your system', 'sparkles');
        setSetting('notifications', false);
        return;
      }
      setSetting('notifications', true);
      setTimeout(testNotification, 200);
    } else {
      setSetting('notifications', false);
    }
  };

  const exportData = async () => {
    const [tasks, projects, reflections] = await Promise.all([
      api.tasks.list(),
      api.projects.list(),
      api.reflections.list(9999),
    ]);
    const streak = await api.streak.get();
    const payload = {
      app: 'Momentum',
      version: '0.1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      reflections,
      streak,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum-export-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported', 'sparkles');
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

      <Section title="Sound">
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button
            className={`pill${sound ? ' selected' : ''}`}
            onClick={() => setSound(true)}
          >
            <Volume2 size={13} /> On
          </button>
          <button
            className={`pill${!sound ? ' selected' : ''}`}
            onClick={() => setSound(false)}
          >
            <VolumeX size={13} /> Off
          </button>
        </div>
      </Section>

      <Section title="Notifications">
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`pill${notifications ? ' selected' : ''}`}
            onClick={() => setNotifications(true)}
          >
            <Bell size={13} /> On
          </button>
          <button
            className={`pill${!notifications ? ' selected' : ''}`}
            onClick={() => setNotifications(false)}
          >
            <BellOff size={13} /> Off
          </button>
          {notifications && (
            <button className="btn btn-ghost" onClick={testNotification} style={{ marginLeft: 'var(--sp-2)' }}>
              Send test
            </button>
          )}
        </div>
        <div style={{ color: 'var(--text-3)', fontSize: 'var(--fs-small)', marginTop: 'var(--sp-2)' }}>
          {!supported()
            ? 'Notifications are not supported here.'
            : permission() === 'denied'
            ? 'Blocked by your system — enable Momentum in OS notification settings.'
            : 'A once-a-day briefing of your most important tasks.'}
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

      <Section title="Data">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)' }}>
          <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5 }}>
            Back up or restore your tasks, projects and reflections as JSON.
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexShrink: 0 }}>
            <button className="btn btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>
              <Upload size={15} /> Import
            </button>
            <button className="btn btn-ghost" onClick={exportData}>
              <Download size={15} /> Export
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={onImportFile}
          />
        </div>
      </Section>

      <Section title="Storage engine">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', color: 'var(--text-2)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5 }}>
          <Database size={18} color="var(--gold-text)" style={{ flexShrink: 0, marginTop: 2 }} />
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
