import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CelebrationLayer from './components/CelebrationLayer';
import TodayView from './pages/TodayView';
import AllTasksView from './pages/AllTasksView';
import StarredView from './pages/StarredView';
import ProjectsView from './pages/ProjectsView';
import ProjectDetailView from './pages/ProjectDetailView';
import AnalyticsView from './pages/AnalyticsView';
import ReflectionView from './pages/ReflectionView';
import SettingsView from './pages/SettingsView';
import AboutView from './pages/AboutView';
import TaskDetail from './components/TaskDetail';
import FocusTimer from './components/FocusTimer';
import Welcome from './components/Welcome';
import HelpModal from './components/HelpModal';
import { useTaskStore } from './store/taskStore';
import { useProjectStore } from './store/projectStore';
import { useUserStore } from './store/userStore';
import { useUiStore } from './store/uiStore';
import { maybeDailyBriefing } from './utils/notifications';
import { levelFromXp, xpFromCompletions } from './utils/gamification';
import { playFanfare } from './utils/sound';

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export default function App() {
  const loadTasks = useTaskStore((s) => s.load);
  const loadProjects = useProjectStore((s) => s.load);
  const loadStreak = useUserStore((s) => s.loadStreak);
  const loadSettings = useUserStore((s) => s.loadSettings);
  const settingsLoaded = useUserStore((s) => s.settingsLoaded);
  const onboarded = useUserStore((s) => s.settings.onboarded);
  const setSetting = useUserStore((s) => s.setSetting);
  const helpOpen = useUiStore((s) => s.helpOpen);
  const closeHelp = useUiStore((s) => s.closeHelp);
  const tasks = useTaskStore((s) => s.tasks);
  const navigate = useNavigate();

  // Detect level-ups and celebrate. Armed only after the first load so we
  // don't fire on existing progress at startup.
  const prevLevel = useRef(null);
  const armed = useRef(false);
  useEffect(() => {
    const completed = tasks.filter((t) => t.isCompleted).length;
    const info = levelFromXp(xpFromCompletions(completed));
    if (!armed.current) {
      if (!useTaskStore.getState().loading) {
        prevLevel.current = info.level;
        armed.current = true;
      }
      return;
    }
    if (info.level > prevLevel.current) {
      useUiStore.getState().burstConfetti();
      useUiStore
        .getState()
        .showToast(`Level up! You're now Level ${info.level} — ${info.title}`, 'trophy', 'levelup');
      playFanfare();
    }
    prevLevel.current = info.level;
  }, [tasks]);

  // Initial data load + theme application.
  useEffect(() => {
    loadProjects();
    loadStreak();
    // Load settings first so the briefing check sees the notification prefs.
    loadSettings().then(() => {
      const theme = useUserStore.getState().settings.theme || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      loadTasks().then(() => {
        maybeDailyBriefing(useTaskStore.getState().tasks);
      });
    });
  }, [loadTasks, loadProjects, loadStreak, loadSettings]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const focusInput = () => {
      const el = document.querySelector('.task-input input.title');
      if (el) {
        el.focus();
        return true;
      }
      return false;
    };

    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing = isTypingTarget(document.activeElement);

      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/today');
        setTimeout(focusInput, 30);
      } else if (mod && e.key.toLowerCase() === 't') {
        e.preventDefault();
        navigate('/today');
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate('/projects');
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigate('/analytics');
      } else if (mod && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      } else if (e.key === '?' && !typing) {
        e.preventDefault();
        useUiStore.getState().openHelp();
      } else if (e.key === ' ' && !typing) {
        // Don't hijack Space while an overlay (modal / focus) is open.
        if (document.querySelector('.modal-overlay, .focus-overlay')) return;
        if (focusInput()) e.preventDefault();
      } else if (e.key === 'Escape' && typing) {
        document.activeElement.blur();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="app-shell">
      <div className="app-bg">
        <div className="app-bg-aurora" />
      </div>
      <Sidebar />
      <main className="main-pane">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayView />} />
          <Route path="/tasks" element={<AllTasksView />} />
          <Route path="/starred" element={<StarredView />} />
          <Route path="/projects" element={<ProjectsView />} />
          <Route path="/projects/:id" element={<ProjectDetailView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/reflection" element={<ReflectionView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/about" element={<AboutView />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <TaskDetail />
      <FocusTimer />
      <CelebrationLayer />
      {helpOpen && <HelpModal onClose={closeHelp} />}
      {settingsLoaded && !onboarded && (
        <Welcome onFinish={() => setSetting('onboarded', true)} />
      )}
    </div>
  );
}
