import { useState, useRef, useEffect } from 'react';
import cn from 'classnames';
import {
  Check, Star, Trash2, Clock, Calendar, Zap, Timer, Repeat, Hash, CheckSquare, FolderPlus, Lock,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useUiStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { useFocusStore } from '../store/focusStore';
import ConfirmDialog from './ConfirmDialog';
import { priorityColor, timeLabel, blockingTasks } from '../utils/taskHelpers';
import { dueLabel, dueTime, dueUrgency, isOverdue } from '../utils/dateHelpers';
import { subtaskProgress } from '../../shared/subtasks';
import { isStreakMilestone } from '../utils/gamification';
import { playChime, playFanfare } from '../utils/sound';

export default function TaskCard({ task, selectionMode = false, selected = false, onToggleSelect }) {
  const { toggleComplete, updateTask, deleteTask } = useTaskStore();
  // Blocked state via primitive selectors: this card re-renders only when its
  // OWN blocking status changes, not on every unrelated task edit.
  const blockedCount = useTaskStore((s) =>
    task.isCompleted ? 0 : blockingTasks(task, s.tasks).length
  );
  const blockerNames = useTaskStore((s) =>
    task.isCompleted ? '' : blockingTasks(task, s.tasks).map((t) => t.title).join(', ')
  );
  const refreshStreak = useUserStore((s) => s.refreshStreak);
  const { celebrate, showToast, openTask, burstConfetti } = useUiStore();
  const projects = useProjectStore((s) => s.projects);
  const startFocus = useFocusStore((s) => s.start);

  const [completing, setCompleting] = useState(false);
  const [confirmBlocked, setConfirmBlocked] = useState(false);
  const checkRef = useRef(null);

  // Quick project-assignment dropdown (closes on outside click).
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!projectPickerOpen) return undefined;
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setProjectPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [projectPickerOpen]);

  const project = projects.find((p) => p.id === task.projectId);
  const overdue = isOverdue(task);
  const urgency = dueUrgency(task);
  const subtasks = task.subtasks || [];
  const { done: doneSubs, total: totalSubs } = subtaskProgress(subtasks);
  const tags = task.tags || [];
  const blocked = blockedCount > 0;

  const doComplete = () => {
    const rect = checkRef.current && checkRef.current.getBoundingClientRect();
    if (rect) celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2);
    playChime();
    setCompleting(true);
    setTimeout(async () => {
      await toggleComplete(task.id, true);
      const streak = await refreshStreak();
      showToast('+10 XP · Nice work', 'sparkles');
      if (streak && isStreakMilestone(streak.currentStreak)) {
        showToast(`🔥 ${streak.currentStreak}-day streak!`, 'flame');
        playFanfare();
        burstConfetti();
      }
      setCompleting(false);
    }, 260);
  };

  const onToggle = async () => {
    if (!task.isCompleted) {
      // Completing a task that's still waiting on others deserves a heads-up.
      if (blocked) {
        setConfirmBlocked(true);
        return;
      }
      doComplete();
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
        selecting: selectionMode,
        selected: selectionMode && selected,
      })}
    >
      <button
        ref={checkRef}
        className={cn('checkbox', {
          done: !selectionMode && task.isCompleted,
          'select-box': selectionMode,
          checked: selectionMode && selected,
        })}
        onClick={(e) => {
          e.stopPropagation();
          if (selectionMode) onToggleSelect(task.id);
          else onToggle();
        }}
        title={selectionMode ? 'Select task' : task.isCompleted ? 'Mark incomplete' : 'Complete task'}
        aria-label={selectionMode ? 'Select task' : 'Toggle complete'}
      >
        {(selectionMode ? selected : task.isCompleted) && <Check size={13} strokeWidth={3} />}
      </button>

      <div
        className="task-body"
        onClick={() => (selectionMode ? onToggleSelect(task.id) : openTask(task.id))}
        style={{ cursor: 'pointer' }}
        title={selectionMode ? 'Select task' : 'Open details'}
      >
        <div className="task-title">{task.title}</div>

        <div className="task-meta">
          {blocked && (
            <span className="tag blocked" title={`Waiting on: ${blockerNames}`}>
              <Lock size={11} /> Waiting on {blockedCount}
            </span>
          )}
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
              {dueTime(task.dueDate) ? ` · ${dueTime(task.dueDate)}` : ''}
            </span>
          )}

          {task.isRecurring && (
            <span className="tag" title="Recurring task">
              <Repeat size={11} color="var(--gold-text)" />
            </span>
          )}

          {totalSubs > 0 && (
            <span className="subtask-progress" title="Subtasks">
              <CheckSquare size={11} />
              {doneSubs}/{totalSubs}
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

      {!selectionMode && (
      <div className="task-actions">
        <div className="quick-project" ref={pickerRef}>
          <button
            className="icon-btn project-btn-sm"
            onClick={() => setProjectPickerOpen((v) => !v)}
            title={project ? `Project: ${project.name}` : 'Assign to a project'}
            aria-label="Assign to a project"
            aria-expanded={projectPickerOpen}
          >
            <FolderPlus size={15} />
          </button>
          {projectPickerOpen && (
            <div className="project-menu" role="menu">
              <button
                className={cn('project-menu-item', { active: !task.projectId })}
                onClick={() => {
                  updateTask(task.id, { projectId: null });
                  setProjectPickerOpen(false);
                }}
              >
                No project
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className={cn('project-menu-item', { active: task.projectId === p.id })}
                  onClick={() => {
                    updateTask(task.id, { projectId: p.id });
                    setProjectPickerOpen(false);
                  }}
                >
                  <span className="dot" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {!task.isCompleted && (
          <button
            className="icon-btn focus-btn-sm"
            onClick={() => startFocus(task)}
            title="Start focus session"
            aria-label="Start focus session"
          >
            <Timer size={15} />
          </button>
        )}
        <button
          className={cn('icon-btn star-btn', { starred: task.isStarred })}
          onClick={() => updateTask(task.id, { isStarred: !task.isStarred })}
          title={task.isStarred ? 'Unstar' : 'Star'}
          aria-label={task.isStarred ? 'Unstar task' : 'Star task'}
        >
          <Star size={15} fill={task.isStarred ? 'currentColor' : 'none'} />
        </button>
        <button
          className="icon-btn"
          onClick={() => deleteTask(task.id)}
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
      )}

      {confirmBlocked && (
        <ConfirmDialog
          title="Complete a blocked task?"
          message={`This task is still waiting on: ${blockerNames}. Complete it anyway?`}
          confirmLabel="Complete anyway"
          danger={false}
          onConfirm={doComplete}
          onClose={() => setConfirmBlocked(false)}
        />
      )}
    </div>
  );
}
