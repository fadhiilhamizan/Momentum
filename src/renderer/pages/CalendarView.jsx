import { useMemo, useState } from 'react';
import {
  startOfWeek, addDays, addWeeks, isSameDay, isToday, format, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useUiStore } from '../store/uiStore';
import { priorityColor } from '../utils/taskHelpers';
import { dueTime, toTimeInputValue, combineDateAndTime } from '../utils/dateHelpers';

/** A week-at-a-glance layout of tasks by due date, with drag-to-reschedule. */
export default function CalendarView() {
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const addTask = useTaskStore((s) => s.addTask);
  const openTask = useUiStore((s) => s.openTask);
  const weekStartsOn = useUserStore((s) => s.settings.weekStart ?? 0);

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn })
  );
  const [dragOver, setDragOver] = useState(null);
  const [addingKey, setAddingKey] = useState(null);
  const [draft, setDraft] = useState('');

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

  const dayKey = (day) => format(day, 'yyyy-MM-dd');

  const rescheduleTo = (taskId, day) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    // Keep the task's time-of-day, just move it to the dropped day.
    const newDue = combineDateAndTime(dayKey(day), toTimeInputValue(t.dueDate));
    if (newDue !== t.dueDate) updateTask(taskId, { dueDate: newDue });
  };

  const onDrop = (e, day) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) rescheduleTo(id, day);
  };

  const submitAdd = async (day) => {
    const title = draft.trim();
    setAddingKey(null);
    setDraft('');
    if (title) await addTask({ title, dueDate: combineDateAndTime(dayKey(day), '') });
  };

  const rangeLabel = `${format(weekStart, 'MMM d')} to ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
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
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn }))}
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
        {byDay.map(({ day, items }) => {
          const key = dayKey(day);
          return (
            <div
              className={`cal-col${isToday(day) ? ' today' : ''}${dragOver === key ? ' drag-over' : ''}`}
              key={day.toISOString()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(key);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragOver(null);
              }}
              onDrop={(e) => onDrop(e, day)}
            >
              <div className="cal-day-head">
                <span className="cal-weekday">{format(day, 'EEE')}</span>
                <span className="cal-date">{format(day, 'd')}</span>
                <button
                  className="cal-add-btn"
                  onClick={() => {
                    setAddingKey(key);
                    setDraft('');
                  }}
                  title="Add a task on this day"
                  aria-label="Add a task on this day"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="cal-items">
                {addingKey === key && (
                  <input
                    className="cal-add-input"
                    autoFocus
                    placeholder="New task…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitAdd(day);
                      else if (e.key === 'Escape') {
                        setAddingKey(null);
                        setDraft('');
                      }
                    }}
                    onBlur={() => {
                      setAddingKey(null);
                      setDraft('');
                    }}
                  />
                )}
                {items.map((t) => (
                  <button
                    key={t.id}
                    className={`cal-task${t.isCompleted ? ' done' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', t.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
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
          );
        })}
      </div>

      {unscheduled > 0 && (
        <div className="cal-unscheduled">
          {unscheduled} active task{unscheduled === 1 ? " isn't" : "s aren't"} shown here (no due date).
        </div>
      )}
    </div>
  );
}
