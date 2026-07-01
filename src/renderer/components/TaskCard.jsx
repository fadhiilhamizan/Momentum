import { useState, useRef } from 'react';
import cn from 'classnames';
import {
  Check, Star, Trash2, Clock, Calendar, Zap, Timer, Repeat, Hash, CheckSquare,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useUiStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { useFocusStore } from '../store/focusStore';
import { priorityColor, timeLabel } from '../utils/taskHelpers';
import { dueLabel, dueUrgency, isOverdue } from '../utils/dateHelpers';
import { isStreakMilestone } from '../utils/gamification';

export default function TaskCard({ task }) {
  const { toggleComplete, updateTask, deleteTask } = useTaskStore();
  const refreshStreak = useUserStore((s) => s.refreshStreak);
  const { celebrate, showToast, openTask } = useUiStore();
  const projects = useProjectStore((s) => s.projects);
  const startFocus = useFocusStore((s) => s.start);

  const [completing, setCompleting] = useState(false);
  const checkRef = useRef(null);

  const project = projects.find((p) => p.id === task.projectId);
  const overdue = isOverdue(task);
  const urgency = dueUrgency(task);
  const subtasks = task.subtasks || [];
  const doneSubs = subtasks.filter((s) => s.done).length;
  const tags = task.tags || [];

  const onToggle = async () => {
    const next = !task.isCompleted;
    if (next) {
      const rect = checkRef.current && checkRef.current.getBoundingClientRect();
      if (rect) celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2);
      setCompleting(true);
      setTimeout(async () => {
        await toggleComplete(task.id, true);
        const streak = await refreshStreak();
        showToast('+10 XP · Nice work', 'sparkles');
        if (streak && isStreakMilestone(streak.currentStreak)) {
          showToast(`🔥 ${streak.currentStreak}-day streak!`, 'flame');
        }
        setCompleting(false);
      }, 260);
    } else {
      await toggleComplete(task.id, false);
    }
  };

  return (
    <div
      className={cn('task-card', {
        completed: task.isCompleted,
        completing,
        overdue: overdue && !task.isCompleted,
      })}
    >
      <button
        ref={checkRef}
        className={cn('checkbox', { done: task.isCompleted })}
        onClick={onToggle}
        title={task.isCompleted ? 'Mark incomplete' : 'Complete task'}
        aria-label="Toggle complete"
      >
        {task.isCompleted && <Check size={13} strokeWidth={3} />}
      </button>

      <div
        className="task-body"
        onClick={() => openTask(task.id)}
        style={{ cursor: 'pointer' }}
        title="Open details"
      >
        <div className="task-title">{task.title}</div>

        <div className="task-meta">
          <span className="tag" title={`${task.priority} priority`}>
            <span className="dot" style={{ background: priorityColor(task.priority) }} />
            {task.priority}
          </span>

          <span className="tag" title="Energy required">
            <Zap size={11} color="var(--energy)" />
            {task.energyRequired}
          </span>

          {task.timeEstimate != null && (
            <span className="tag">
              <Clock size={11} />
              {timeLabel(task.timeEstimate)}
            </span>
          )}

          {task.dueDate && (
            <span className={cn('due', urgency)}>
              <Calendar size={11} />
              {dueLabel(task.dueDate)}
            </span>
          )}

          {task.isRecurring && (
            <span className="tag" title="Recurring task">
              <Repeat size={11} color="var(--gold)" />
            </span>
          )}

          {subtasks.length > 0 && (
            <span className="subtask-progress" title="Subtasks">
              <CheckSquare size={11} />
              {doneSubs}/{subtasks.length}
            </span>
          )}

          {project && (
            <span className="tag" title="Project">
              <span className="dot" style={{ background: project.color }} />
              {project.name}
            </span>
          )}

          {tags.slice(0, 3).map((t) => (
            <span className="tag-mini" key={t}>
              <Hash size={10} />
              {t}
            </span>
          ))}
          {tags.length > 3 && <span className="tag-mini">+{tags.length - 3}</span>}
        </div>
      </div>

      <div className="task-actions">
        {!task.isCompleted && (
          <button
            className="icon-btn focus-btn-sm"
            onClick={() => startFocus(task)}
            title="Start focus session"
          >
            <Timer size={15} />
          </button>
        )}
        <button
          className={cn('icon-btn star-btn', { starred: task.isStarred })}
          onClick={() => updateTask(task.id, { isStarred: !task.isStarred })}
          title={task.isStarred ? 'Unstar' : 'Star'}
        >
          <Star size={15} fill={task.isStarred ? 'currentColor' : 'none'} />
        </button>
        <button className="icon-btn" onClick={() => deleteTask(task.id)} title="Delete task">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
