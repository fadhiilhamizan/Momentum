import { format, parseISO } from 'date-fns';
import { Flame, Trophy } from 'lucide-react';
import Modal from './Modal';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { levelFromXp, xpFromCompletions, XP_PER_TASK } from '../utils/gamification';
import { todayKey } from '../utils/dateHelpers';

function safeDate(key) {
  try {
    return format(parseISO(key), 'MMM d, yyyy');
  } catch (_) {
    return key;
  }
}

function Stat({ label, value }) {
  return (
    <div className="progress-stat">
      <div className="progress-stat-value">{value}</div>
      <div className="progress-stat-label">{label}</div>
    </div>
  );
}

/** A detailed view of the user's streak and level, opened from the sidebar. */
export default function ProgressModal({ onClose }) {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useUserStore((s) => s.streak);

  const completed = tasks.filter((t) => t.isCompleted).length;
  const lvl = levelFromXp(xpFromCompletions(completed));
  const atRisk = streak.lastCompletedDate !== todayKey();
  const started = streak.startDate ? safeDate(streak.startDate) : null;

  const days = (n) => `${n} day${n === 1 ? '' : 's'}`;

  return (
    <Modal title="Your progress" onClose={onClose}>
      <div className="progress-section">
        <div className="progress-heading">
          <Flame size={16} color="var(--gold-text)" /> Streak
        </div>
        <div className="progress-stats">
          <Stat label="Current" value={days(streak.currentStreak)} />
          <Stat label="Longest" value={days(streak.longestStreak)} />
          {started && <Stat label="Started" value={started} />}
        </div>
        <div
          className="progress-note"
          style={{
            color:
              atRisk && streak.currentStreak > 0
                ? 'var(--priority-high)'
                : 'var(--text-3)',
          }}
        >
          {streak.currentStreak === 0
            ? 'Complete a task today to start a new streak.'
            : atRisk
            ? 'Complete one task today to keep your streak alive.'
            : "Today's done. Your streak is safe."}
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-heading">
          <Trophy size={16} color="var(--gold-text)" /> Level {lvl.level} · {lvl.title}
        </div>
        <div className="level-track" style={{ margin: 'var(--sp-3) 0' }}>
          <div className="level-fill" style={{ width: `${lvl.progress * 100}%` }} />
        </div>
        <div className="progress-stats">
          <Stat label="Total XP" value={lvl.xp} />
          <Stat label="To next level" value={`${lvl.toNext} XP`} />
          <Stat label="Tasks done" value={completed} />
        </div>
        <div className="progress-note">
          Each completed task earns {XP_PER_TASK} XP.
        </div>
      </div>
    </Modal>
  );
}
