import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus, SkipForward, X, Check, Coffee } from 'lucide-react';
import { useFocusStore } from '../store/focusStore';
import { useTaskStore } from '../store/taskStore';
import { useUserStore } from '../store/userStore';
import { useUiStore } from '../store/uiStore';
import ProgressRing from './ProgressRing';
import { playChime } from '../utils/sound';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const DIFFICULTIES = ['Easy', 'Just right', 'Hard'];

/**
 * Full-screen focus session. Hides everything but the current task and runs a
 * Pomodoro countdown, with a short post-session review.
 */
export default function FocusTimer() {
  const {
    phase, title, taskId, totalSec, remainingSec, breakType,
    tick, pause, resume, addMinutes, toReview, startBreak, restart, close,
  } = useFocusStore();
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const refreshStreak = useUserStore((s) => s.refreshStreak);
  const { celebrate, showToast } = useUiStore();
  const [difficulty, setDifficulty] = useState(null);
  const intervalRef = useRef(null);

  // One-second ticker while a focus session or a break is running.
  useEffect(() => {
    if (phase === 'running' || phase === 'break') {
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    }
    return undefined;
  }, [phase, tick]);

  // Reset the review selection whenever a new review starts.
  useEffect(() => {
    if (phase === 'review') setDifficulty(null);
  }, [phase]);

  // Lock background scroll and allow Escape to exit while the overlay is up.
  useEffect(() => {
    if (!phase) return undefined;
    lockScroll();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      unlockScroll();
    };
  }, [phase, close]);

  if (!phase) return null;

  const progress = totalSec > 0 ? (totalSec - remainingSec) / totalSec : 0;

  const completeTask = async () => {
    celebrate(window.innerWidth / 2, window.innerHeight / 2);
    playChime();
    await toggleComplete(taskId, true);
    await refreshStreak();
    showToast('+10 XP · Focus complete', 'sparkles');
    close();
  };

  return (
    <div className="focus-overlay">
      <button className="icon-btn focus-exit" onClick={close} title="Exit focus" aria-label="Exit focus">
        <X size={22} />
      </button>

      {(phase === 'running' || phase === 'paused') && (
        <div className="focus-card">
          <div className="focus-eyebrow">Focus session</div>
          <div className="focus-task">{title}</div>
          <div className="focus-ring-wrap">
            <ProgressRing value={progress} size={260} stroke={8} />
            <div className="focus-time">{fmt(remainingSec)}</div>
            <div className="focus-phase">{phase === 'paused' ? 'Paused' : 'Stay with it'}</div>
          </div>
          <div className="focus-controls">
            <button className="focus-btn" onClick={() => addMinutes(5)} title="Add 5 minutes" aria-label="Add 5 minutes">
              <Plus size={20} />
            </button>
            <button
              className="focus-btn primary"
              onClick={() => (phase === 'running' ? pause() : resume())}
              title={phase === 'running' ? 'Pause' : 'Resume'}
              aria-label={phase === 'running' ? 'Pause' : 'Resume'}
            >
              {phase === 'running' ? <Pause size={26} /> : <Play size={26} />}
            </button>
            <button className="focus-btn" onClick={toReview} title="Finish early" aria-label="Finish early">
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      )}

      {phase === 'break' && (
        <div className="focus-card">
          <div className="focus-eyebrow">{breakType === 'long' ? 'Long break' : 'Short break'}</div>
          <div className="focus-task">Rest and recharge</div>
          <div className="focus-ring-wrap">
            <ProgressRing value={progress} size={260} stroke={8} />
            <div className="focus-time">{fmt(remainingSec)}</div>
            <div className="focus-phase">Breathe</div>
          </div>
          <button className="btn btn-ghost" onClick={() => restart()}>
            <SkipForward size={15} /> Skip break
          </button>
        </div>
      )}

      {phase === 'breakDone' && (
        <div className="focus-card focus-review">
          <div className="focus-eyebrow">Break over</div>
          <div className="focus-task">Ready for another session?</div>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)' }}>
            <button className="btn btn-primary" onClick={() => restart()}>
              <Play size={15} /> Start focus
            </button>
            <button className="btn btn-ghost" onClick={close}>
              Done
            </button>
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="focus-card focus-review">
          <div className="focus-eyebrow">Session complete</div>
          <div className="focus-task">How did “{title}” go?</div>
          <div className="selector-group" style={{ justifyContent: 'center' }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`pill${difficulty === d ? ' selected' : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => addMinutes(25)}>
              <Play size={15} /> Keep working
            </button>
            <button className="btn btn-ghost" onClick={startBreak}>
              <Coffee size={15} /> Take a break
            </button>
            <button className="btn btn-primary" onClick={completeTask}>
              <Check size={15} /> Complete task
            </button>
          </div>
          <button className="btn btn-ghost" onClick={close} style={{ marginTop: 'var(--sp-1)' }}>
            Just close
          </button>
        </div>
      )}
    </div>
  );
}
