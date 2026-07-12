import { NavLink } from 'react-router-dom';
import cn from 'classnames';
import {
  Target,
  CalendarDays,
  ListChecks,
  Star,
  FolderKanban,
  BarChart3,
  NotebookPen,
  Settings,
  Info,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useUiStore } from '../store/uiStore';
import { levelFromXp, xpFromCompletions } from '../utils/gamification';
import { todayKey } from '../utils/dateHelpers';
import { useT } from '../i18n';
import ProgressModal from './ProgressModal';

const NAV = [
  { to: '/today', key: 'nav.today', icon: Target },
  { to: '/calendar', key: 'nav.calendar', icon: CalendarDays },
  { to: '/tasks', key: 'nav.tasks', icon: ListChecks, badge: 'open' },
  { to: '/starred', key: 'nav.starred', icon: Star, badge: 'starred' },
  { to: '/projects', key: 'nav.projects', icon: FolderKanban },
  { to: '/analytics', key: 'nav.analytics', icon: BarChart3 },
  { to: '/reflection', key: 'nav.reflection', icon: NotebookPen },
  { to: '/settings', key: 'nav.settings', icon: Settings },
  { to: '/about', key: 'nav.about', icon: Info },
];

export default function Sidebar() {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useUserStore((s) => s.streak);
  const streakBump = useUserStore((s) => s.streakBump);
  const openHelp = useUiStore((s) => s.openHelp);
  const t = useT();

  const openCount = tasks.filter((t) => !t.isCompleted).length;
  const starredCount = tasks.filter((t) => t.isStarred && !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  const badges = { open: openCount, starred: starredCount };

  const xp = xpFromCompletions(completedCount);
  const lvl = levelFromXp(xp);

  const atRisk = streak.lastCompletedDate !== todayKey();

  const [progressOpen, setProgressOpen] = useState(false);

  // Trigger the count-pop animation whenever the streak increments.
  const [bumping, setBumping] = useState(false);
  useEffect(() => {
    if (streakBump === 0) return;
    setBumping(true);
    const t = setTimeout(() => setBumping(false), 320);
    return () => clearTimeout(t);
  }, [streakBump]);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Flame size={18} />
        </div>
        <div className="brand-name">
          Mo<span className="accent">mentum</span>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('nav-item', { active: isActive })}
            >
              <Icon size={17} />
              {t(item.key)}
              {count > 0 && <span className="count">{count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-card">
          <button
            className="status-btn"
            onClick={() => setProgressOpen(true)}
            title="View your progress"
            aria-label="Streak details"
          >
            <div className="streak-row">
              <span className={cn('streak-flame', { 'at-risk': atRisk && streak.currentStreak === 0 })}>
                <Flame size={20} fill={streak.currentStreak > 0 ? 'currentColor' : 'none'} />
              </span>
              <span className={cn('streak-num', { bump: bumping })}>
                {streak.currentStreak}
              </span>
              <span className="streak-caption">
                {t('sidebar.dayStreak')}
                {atRisk && streak.currentStreak > 0 && (
                  <>
                    <br />
                    complete one to keep it
                  </>
                )}
              </span>
            </div>
          </button>

          <button
            className="status-btn"
            onClick={() => setProgressOpen(true)}
            title="View your progress"
            aria-label="Level details"
          >
            <div className="level-meta">
              <span>Lv {lvl.level} · {lvl.title}</span>
              <span>{lvl.toNext} XP to go</span>
            </div>
            <div className="level-track" style={{ marginTop: 6 }}>
              <div className="level-fill" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
          </button>
        </div>

        <button className="help-btn" onClick={openHelp} title="Help & shortcuts (?)">
          <HelpCircle size={14} /> {t('sidebar.help')}
        </button>
      </div>

      {progressOpen && <ProgressModal onClose={() => setProgressOpen(false)} />}
    </aside>
  );
}
