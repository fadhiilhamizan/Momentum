import { useEffect } from 'react';
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
import { useTaskStore } from './store/taskStore';
import { useProjectStore } from './store/projectStore';
import { useUserStore } from './store/userStore';

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
  const navigate = useNavigate();

  // Initial data load + theme application.
  useEffect(() => {
    loadTasks();
    loadProjects();
    loadStreak();
    loadSettings().then(() => {
      const theme = useUserStore.getState().settings.theme || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
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
    </div>
  );
}
