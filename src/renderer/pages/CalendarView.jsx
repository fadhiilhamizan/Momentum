import { useMemo, useState } from 'react';
import cn from 'classnames';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  addDays, addWeeks, addMonths, isSameDay, isSameMonth, isToday, format, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useUiStore } from '../store/uiStore';
import { priorityColor } from '../utils/taskHelpers';
import { dueTime, toTimeInputValue, combineDateAndTime } from '../utils/dateHelpers';

const MONTH_VISIBLE = 3; // task chips shown per day cell before "+N more"

/**
 * Calendar of tasks by due date, with drag-to-reschedule. Switches between a
 * week-at-a-glance and a full-month grid; the choice is remembered in settings
 * (month by default).
 */
export default function CalendarView() {
  const tasks = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const addTask = useTaskStore((s) => s.addTask);
  const openTask = useUiStore((s) => s.openTask);
  const weekStartsOn = useUserStore((s) => s.settings.weekStart ?? 0);
  const view = useUserStore((s) => s.settings.calendarView || 'month');
  const setSetting = useUserStore((s) => s.setSetting);

  const isMonth = view === 'month';

  const [cursor, setCursor] = useState(() => new Date());
  const [dragOver, setDragOver] = useState(null);
  const [addingKey, setAddingKey] = useState(null);
  const [draft, setDraft] = useState('');

  // Days rendered for the current view.
  const days = useMemo(() => {
    if (isMonth) {
      const start = startOfWeek(startOfMonth(cursor), { weekStartsOn });
      const end = endOfWeek(endOfMonth(cursor), { weekStartsOn });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(cursor, { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor, isMonth, weekStartsOn]);

  const tasksByKey = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const parsed = parseISO(t.dueDate);
      if (Number.isNaN(parsed.getTime())) continue;
      const k = format(parsed, 'yyyy-MM-dd');
      (map[k] = map[k] || []).push(t);
    }
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    );
    return map;
  }, [tasks]);

  const dayKey = (day) => format(day, 'yyyy-MM-dd');
  const itemsFor = (day) => tasksByKey[dayKey(day)] || [];

  const weekdayLabels = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => format(addDays(base, i), 'EEE'));
  }, [weekStartsOn]);

  const rescheduleTo = (taskId, day) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
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

  const startAdd = (key) => {
    setAddingKey(key);
    setDraft('');
  };
  const cancelAdd = () => {
    setAddingKey(null);
    setDraft('');
  };

  const setView = (mode) => setSetting('calendarView', mode);
  const goPrev = () => setCursor((c) => (isMonth ? addMonths(c, -1) : addWeeks(c, -1)));
  const goNext = () => setCursor((c) => (isMonth ? addMonths(c, 1) : addWeeks(c, 1)));
  const goToday = () => setCursor(new Date());
  const openDayInWeek = (day) => {
    setCursor(day);
    setView('week');
  };

  const weekStart = startOfWeek(cursor, { weekStartsOn });
  const rangeLabel = isMonth
    ? format(cursor, 'MMMM yyyy')
    : `${format(weekStart, 'MMM d')} to ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
  const unscheduled = tasks.filter((t) => !t.isCompleted && !t.dueDate).length;

  const dropHandlers = (key, day) => ({
    onDragOver: (e) => {
      e.preventDefault();
      setDragOver(key);
    },
    onDragLeave: (e) => {
      if (e.currentTarget === e.target) setDragOver(null);
    },
    onDrop: (e) => onDrop(e, day),
  });

  const addInput = (day) => (
    <input
      className="cal-add-input"
      autoFocus
      placeholder="New task…"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submitAdd(day);
        else if (e.key === 'Escape') cancelAdd();
      }}
      onBlur={cancelAdd}
    />
  );

  const taskChip = (t) => (
    <button
      key={t.id}
      className={cn('cal-task', { done: t.isCompleted })}
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
  );

  return (
    <div className="view">
      <div className="view-head" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-4)' }}>
        <div style={{ flex: 1 }}>
          <div className="view-title">Calendar</div>
          <div className="view-subtitle">{rangeLabel}</div>
        </div>
        <div className="cal-nav">
          <div className="segmented" role="tablist" aria-label="Calendar view">
            <button
              className={!isMonth ? 'active' : ''}
              onClick={() => setView('week')}
              aria-pressed={!isMonth}
            >
              Week
            </button>
            <button
              className={isMonth ? 'active' : ''}
              onClick={() => setView('month')}
              aria-pressed={isMonth}
            >
              Month
            </button>
          </div>
          <button className="icon-btn" onClick={goPrev} title={isMonth ? 'Previous month' : 'Previous week'} aria-label={isMonth ? 'Previous month' : 'Previous week'}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn btn-ghost" onClick={goToday}>
            Today
          </button>
          <button className="icon-btn" onClick={goNext} title={isMonth ? 'Next month' : 'Next week'} aria-label={isMonth ? 'Next month' : 'Next week'}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isMonth ? (
        <>
          <div className="cal-month-weekdays">
            {weekdayLabels.map((w) => (
              <div className="cal-month-weekday" key={w}>{w}</div>
            ))}
          </div>
          <div className="cal-month-grid">
            {days.map((day) => {
              const key = dayKey(day);
              const items = itemsFor(day);
              const extra = items.length - MONTH_VISIBLE;
              return (
                <div
                  key={day.toISOString()}
                  className={cn('cal-cell', {
                    today: isToday(day),
                    outside: !isSameMonth(day, cursor),
                    'drag-over': dragOver === key,
                  })}
                  {...dropHandlers(key, day)}
                >
                  <div className="cal-cell-head">
                    <span className="cal-cell-date">{format(day, 'd')}</span>
                    <button
                      className="cal-add-btn"
                      onClick={() => startAdd(key)}
                      title="Add a task on this day"
                      aria-label="Add a task on this day"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="cal-cell-items">
                    {addingKey === key && addInput(day)}
                    {items.slice(0, MONTH_VISIBLE).map(taskChip)}
                    {extra > 0 && (
                      <button className="cal-more" onClick={() => openDayInWeek(day)}>
                        +{extra} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="cal-grid">
          {days.map((day) => {
            const key = dayKey(day);
            const items = itemsFor(day);
            return (
              <div
                key={day.toISOString()}
                className={cn('cal-col', { today: isToday(day), 'drag-over': dragOver === key })}
                {...dropHandlers(key, day)}
              >
                <div className="cal-day-head">
                  <span className="cal-weekday">{format(day, 'EEE')}</span>
                  <span className="cal-date">{format(day, 'd')}</span>
                  <button
                    className="cal-add-btn"
                    onClick={() => startAdd(key)}
                    title="Add a task on this day"
                    aria-label="Add a task on this day"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className="cal-items">
                  {addingKey === key && addInput(day)}
                  {items.map(taskChip)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unscheduled > 0 && (
        <div className="cal-unscheduled">
          {unscheduled} active task{unscheduled === 1 ? " isn't" : "s aren't"} shown here (no due date).
        </div>
      )}
    </div>
  );
}
