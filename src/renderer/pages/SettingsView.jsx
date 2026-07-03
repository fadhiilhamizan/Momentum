import { useRef, useState } from 'react';
import { Moon, Sun, Monitor, Shield, Database, Volume2, VolumeX, Download, Upload, Bell, BellOff, Trash2, AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useTaskStore } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import api, { isElectron } from '../utils/api';
import { playChime } from '../utils/sound';
import { todayKey, setTimeFormat } from '../utils/dateHelpers';
import { useUiStore } from '../store/uiStore';
import { applyTheme } from '../utils/theme';
import ConfirmDialog from '../components/ConfirmDialog';
import { requestPermission, permission, testNotification, supported } from '../utils/notifications';

const APP_VERSION =
  (typeof process !== 'undefined' && process.env && process.env.APP_VERSION) || '1.0.0';

function Section({ title, danger = false, children }) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: `1px solid ${danger ? 'var(--priority-critical)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: 'var(--sp-5)',
        marginBottom: 'var(--sp-4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--fs-h3)', fontWeight: 600, marginBottom: 'var(--sp-3)', textTransform: 'uppercase', letterSpacing: '0.06em', color: danger ? 'var(--priority-critical)' : 'var(--text-2)' }}>
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
  const weekStart = useUserStore((s) => s.settings.weekStart ?? 0);
  const timeFormat = useUserStore((s) => s.settings.timeFormat || '12h');
  const reminderLead = useUserStore((s) => s.settings.reminderLead ?? 0);
  const setSetting = useUserStore((s) => s.setSetting);

  const setTheme = (value) => {
    setSetting('theme', value);
    applyTheme(value);
  };

  const setSound = (value) => {
    setSetting('sound', value);
    if (value) setTimeout(playChime, 0);
  };

  const changeTimeFormat = (value) => {
    setSetting('timeFormat', value);
    setTimeFormat(value); // apply immediately across the app
  };

  const showToast = useUiStore((s) => s.showToast);
  const reloadTasks = useTaskStore((s) => s.load);
  const reloadProjects = useProjectStore((s) => s.load);
  const reloadStreak = useUserStore((s) => s.loadStreak);
  const fileRef = useRef(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const onImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const counts = await api.data.import(payload);
      await Promise.all([reloadTasks(), reloadProjects(), reloadStreak()]);
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
      version: APP_VERSION,
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

  const clearAllData = async () => {
    try {
      await api.data.clear();
      await Promise.all([reloadTasks(), reloadProjects(), reloadStreak()]);
      showToast('All data deleted', 'sparkles');
    } catch (err) {
      console.error('Delete all failed', err);
      showToast("Couldn't delete your data", 'sparkles');
    }
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
          <button
            className={`pill${theme === 'system' ? ' selected' : ''}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={13} /> System
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

      <Section title={<><CalendarDays size={13} /> Calendar & time</>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-3)', marginBottom: 'var(--sp-2)' }}>
              Week starts on
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button className={`pill${weekStart === 0 ? ' selected' : ''}`} onClick={() => setSetting('weekStart', 0)}>
                Sunday
              </button>
              <button className={`pill${weekStart === 1 ? ' selected' : ''}`} onClick={() => setSetting('weekStart', 1)}>
                Monday
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-3)', marginBottom: 'var(--sp-2)' }}>
              Time format
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <button className={`pill${timeFormat === '12h' ? ' selected' : ''}`} onClick={() => changeTimeFormat('12h')}>
                <Clock size={13} /> 12-hour
              </button>
              <button className={`pill${timeFormat === '24h' ? ' selected' : ''}`} onClick={() => changeTimeFormat('24h')}>
                <Clock size={13} /> 24-hour
              </button>
            </div>
          </div>
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
            ? 'Blocked by your system. Enable Momentum in OS notification settings.'
            : 'A daily briefing, plus a reminder when a task with a due time comes due.'}
        </div>
        {notifications && (
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-3)', marginBottom: 'var(--sp-2)' }}>
              Remind me before a task is due
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
              {[
                { v: 0, l: 'At due time' },
                { v: 10, l: '10 min before' },
                { v: 30, l: '30 min before' },
                { v: 60, l: '1 hour before' },
              ].map((o) => (
                <button
                  key={o.v}
                  className={`pill${reminderLead === o.v ? ' selected' : ''}`}
                  onClick={() => setSetting('reminderLead', o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        )}
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
              <Download size={15} /> Import
            </button>
            <button className="btn btn-ghost" onClick={exportData}>
              <Upload size={15} /> Export
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
              ? 'SQLite (WebAssembly build), no native compilation required.'
              : 'Browser localStorage (preview mode). Launch the desktop app for the full SQLite database.'}
          </div>
        </div>
      </Section>

      <Section title={<><AlertTriangle size={14} /> Danger Zone</>} danger>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5, flex: 1, minWidth: 220 }}>
            Permanently delete every task, project and reflection, and reset your streak.
            This can’t be undone. Export a backup first if you might want your data back.
          </div>
          <button
            className="btn btn-ghost"
            style={{ color: 'var(--priority-critical)', borderColor: 'var(--priority-critical)', flexShrink: 0 }}
            onClick={() => setConfirmingClear(true)}
          >
            <Trash2 size={15} /> Delete all data
          </button>
        </div>
      </Section>

      {confirmingClear && (
        <ConfirmDialog
          title="Delete all data?"
          message="This permanently deletes all of your tasks, projects and reflections, and resets your streak and progress. This action cannot be undone."
          confirmLabel="Delete everything"
          onConfirm={clearAllData}
          onClose={() => setConfirmingClear(false)}
        />
      )}
    </div>
  );
}
