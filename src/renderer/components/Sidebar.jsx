import { NavLink } from 'react-router-dom';
import cn from 'classnames';
import {
  Target,
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

const NAV = [
  { to: '/today', label: 'Today', icon: Target },
  { to: '/tasks', label: 'All Tasks', icon: ListChecks, badge: 'open' },
  { to: '/starred', label: 'Starred', icon: Star, badge: 'starred' },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/reflection', label: 'Reflection', icon: NotebookPen },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info },
];

export default function Sidebar() {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useUserStore((s) => s.streak);
  const streakBump = useUserStore((s) => s.streakBump);
  const openHelp = useUiStore((s) => s.openHelp);

  const openCount = tasks.filter((t) => !t.isCompleted).length;
  const starredCount = tasks.filter((t) => t.isStarred && !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  const badges = { open: openCount, starred: starredCount };

  const xp = xpFromCompletions(completedCount);
  const lvl = levelFromXp(xp);

  const atRisk = streak.lastCompletedDate !== todayKey();

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
              {item.label}
              {count > 0 && <span className="count">{count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-card">
          <div className="streak-row">
            <span className={cn('streak-flame', { 'at-risk': atRisk && streak.currentStreak === 0 })}>
              <Flame size={20} fill={streak.currentStreak > 0 ? 'currentColor' : 'none'} />
            </span>
            <span className={cn('streak-num', { bump: bumping })}>
              {streak.currentStreak}
            </span>
            <span className="streak-caption">
              day streak
              {atRisk && streak.currentStreak > 0 && (
                <>
                  <br />
                  complete one to keep it
                </>
              )}
            </span>
          </div>

          <div>
            <div className="level-meta">
              <span>Lv {lvl.level} · {lvl.title}</span>
              <span>{lvl.toNext} XP to go</span>
            </div>
            <div className="level-track" style={{ marginTop: 6 }}>
              <div className="level-fill" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
          </div>
        </div>

        <button className="help-btn" onClick={openHelp} title="Help & shortcuts (?)">
          <HelpCircle size={14} /> Help & shortcuts
        </button>
      </div>
    </aside>
  );
}
