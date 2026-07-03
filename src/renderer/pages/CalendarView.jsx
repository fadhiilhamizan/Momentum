import { useMemo, useState } from 'react';
import {
  startOfWeek, addDays, addWeeks, isSameDay, isToday, format, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUiStore } from '../store/uiStore';
import { priorityColor } from '../utils/taskHelpers';
import { dueTime } from '../utils/dateHelpers';

/** A week-at-a-glance layout of tasks by due date. */
export default function CalendarView() {
  const tasks = useTaskStore((s) => s.tasks);
  const openTask = useUiStore((s) => s.openTask);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const byDay = useMemo(
    () =>
      days.map((day) => ({
        day,
        items: tasks
          .filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), day))
          .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
      })),
    [days, tasks]
  );

  const rangeLabel = `${format(weekStart, 'MMM d')} to ${format(
    addDays(weekStart, 6),
    'MMM d, yyyy'
  )}`;
  const unscheduled = tasks.filter((t) => !t.isCompleted && !t.dueDate).length;

  return (
    <div className="view">
      <div className="view-head" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-4)' }}>
        <div style={{ flex: 1 }}>
          <div className="view-title">Calendar</div>
          <div className="view-subtitle">{rangeLabel}</div>
        </div>
        <div className="cal-nav">
          <button
            className="icon-btn"
            onClick={() => setWeekStart((w) => addWeeks(w, -1))}
            title="Previous week"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}
          >
            Today
          </button>
          <button
            className="icon-btn"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            title="Next week"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="cal-grid">
        {byDay.map(({ day, items }) => (
          <div className={`cal-col${isToday(day) ? ' today' : ''}`} key={day.toISOString()}>
            <div className="cal-day-head">
              <span className="cal-weekday">{format(day, 'EEE')}</span>
              <span className="cal-date">{format(day, 'd')}</span>
            </div>
            <div className="cal-items">
              {items.map((t) => (
                <button
                  key={t.id}
                  className={`cal-task${t.isCompleted ? ' done' : ''}`}
                  onClick={() => openTask(t.id)}
                  title={t.title}
                >
                  <span className="dot" style={{ background: priorityColor(t.priority) }} />
                  {dueTime(t.dueDate) && <span className="cal-time">{dueTime(t.dueDate)}</span>}
                  <span className="cal-task-title">{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {unscheduled > 0 && (
        <div className="cal-unscheduled">
          {unscheduled} active task{unscheduled === 1 ? " isn't" : "s aren't"} shown here (no due date).
        </div>
      )}
    </div>
  );
}
