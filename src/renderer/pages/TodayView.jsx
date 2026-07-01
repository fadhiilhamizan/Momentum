import { useMemo, useRef, useState } from 'react';
import { Sparkles, Zap, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import TaskInput from '../components/TaskInput';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import { groupByEnergy } from '../utils/taskHelpers';
import { isOverdue, isDueToday, greeting, fullDate } from '../utils/dateHelpers';

const TIME_BUDGETS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2+ hrs' },
];
const ENERGY_FILTERS = ['Low', 'Medium', 'High'];

export default function TodayView() {
  const tasks = useTaskStore((s) => s.tasks);
  const streak = useUserStore((s) => s.streak);
  const inputRef = useRef(null);

  const [energyFilter, setEnergyFilter] = useState(null);
  const [timeBudget, setTimeBudget] = useState(null);

  const { overdue, todays, completedToday } = useMemo(() => {
    const overdue = [];
    const todays = [];
    const completedToday = [];
    for (const t of tasks) {
      if (t.isCompleted) {
        if (isDueToday(t.completedDate)) completedToday.push(t);
        continue;
      }
      if (isOverdue(t)) overdue.push(t);
      else if (isDueToday(t.dueDate) || !t.dueDate) todays.push(t);
    }
    return { overdue, todays, completedToday };
  }, [tasks]);

  const filtered = useMemo(() => {
    let list = todays;
    if (energyFilter) list = list.filter((t) => t.energyRequired === energyFilter);
    if (timeBudget)
      list = list.filter((t) => (t.timeEstimate ?? 30) <= timeBudget);
    return list;
  }, [todays, energyFilter, timeBudget]);

  const groups = useMemo(() => groupByEnergy(filtered), [filtered]);
  const filtering = !!(energyFilter || timeBudget);
  const allDone = todays.length === 0 && overdue.length === 0 && completedToday.length > 0;

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">{greeting()}</div>
        <div className="view-subtitle">{fullDate()}</div>
      </div>

      {/* Momentum banner */}
      <div className="momentum-banner">
        <div className="banner-icon">
          <TrendingUp size={24} />
        </div>
        <div>
          <div className="banner-headline">
            {allDone
              ? "You've got momentum! 🎉"
              : streak.currentStreak > 0
              ? `${streak.currentStreak}-day streak going strong`
              : 'Build momentum today'}
          </div>
          <div className="banner-sub">
            {allDone
              ? 'Everything for today is done. Take a breath — or get ahead.'
              : `${todays.length + overdue.length} task${
                  todays.length + overdue.length === 1 ? '' : 's'
                } on deck. Complete one to keep your streak alive.`}
          </div>
        </div>
        <div className="banner-stat">
          <div className="big">{streak.currentStreak}</div>
          <div className="label">day streak</div>
        </div>
      </div>

      {/* Quick energy / time selector */}
      <div className="quick-bar">
        <span className="label">
          <Zap size={15} color="var(--energy)" /> Energy
        </span>
        {ENERGY_FILTERS.map((e) => (
          <button
            key={e}
            className={`pill${energyFilter === e ? ' selected' : ''}`}
            onClick={() => setEnergyFilter(energyFilter === e ? null : e)}
          >
            {e}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: 'var(--divider)' }} />
        <span className="label">
          <Clock size={15} /> I have
        </span>
        {TIME_BUDGETS.map((t) => (
          <button
            key={t.value}
            className={`pill${timeBudget === t.value ? ' selected' : ''}`}
            onClick={() => setTimeBudget(timeBudget === t.value ? null : t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <TaskInput ref={inputRef} defaults={{ dueDate: null }} />

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="task-group">
          <div className="task-group-title" style={{ color: 'var(--priority-critical)' }}>
            Overdue <span className="count">· {overdue.length}</span>
          </div>
          <div className="task-list">
            {overdue.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {/* Today, grouped by energy */}
      {groups.length > 0 ? (
        groups.map((g) => (
          <div className="task-group" key={g.level}>
            <div className="task-group-title">
              <Zap size={13} color="var(--energy)" />
              {g.level} energy <span className="count">· {g.tasks.length}</span>
            </div>
            <div className="task-list">
              {g.tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        ))
      ) : filtering ? (
        <EmptyState icon={<Sparkles size={26} />} title="No matching tasks">
          Nothing fits that energy/time window right now. Try clearing the
          filters above.
        </EmptyState>
      ) : overdue.length === 0 && completedToday.length === 0 ? (
        <EmptyState icon={<Sparkles size={26} />} title="A clean slate">
          Add your first task above. Small steps build big momentum.
        </EmptyState>
      ) : null}

      {/* Completed today summary */}
      {completedToday.length > 0 && (
        <div className="task-group" style={{ marginTop: 'var(--sp-8)' }}>
          <div className="task-group-title">
            <CheckCircle2 size={13} color="var(--success)" />
            Completed today <span className="count">· {completedToday.length}</span>
          </div>
          <div className="task-list">
            {completedToday.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
