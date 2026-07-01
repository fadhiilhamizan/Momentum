import { useMemo } from 'react';
import { CheckCircle2, Flame, ListTodo, Trophy } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import Placeholder from '../components/Placeholder';
import { levelFromXp, xpFromCompletions } from '../utils/gamification';

/** A lightweight stats preview until the full charts arrive in Phase 3. */
export default function AnalyticsView() {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useUserStore((s) => s.streak);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.isCompleted).length;
    const open = tasks.filter((t) => !t.isCompleted).length;
    const lvl = levelFromXp(xpFromCompletions(completed));
    return { completed, open, lvl };
  }, [tasks]);

  const cards = [
    { icon: CheckCircle2, label: 'Completed', value: stats.completed, color: 'var(--success)' },
    { icon: ListTodo, label: 'Active', value: stats.open, color: 'var(--energy)' },
    { icon: Flame, label: 'Current streak', value: streak.currentStreak, color: 'var(--gold)' },
    { icon: Trophy, label: 'Longest streak', value: streak.longestStreak, color: 'var(--gold-light)' },
  ];

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">Analytics</div>
        <div className="view-subtitle">
          Level {stats.lvl.level} · {stats.lvl.title}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-6)',
        }}
      >
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              style={{
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--sp-4)',
              }}
            >
              <Icon size={18} color={c.color} />
              <div style={{ fontSize: 'var(--fs-display)', fontWeight: 700, marginTop: 'var(--sp-2)' }}>
                {c.value}
              </div>
              <div style={{ fontSize: 'var(--fs-tiny)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      <Placeholder phase="Full charts in Phase 3">
        Productivity heatmaps, daily completion trends, category breakdowns and
        energy-pattern insights build on the stats above.
      </Placeholder>
    </div>
  );
}
