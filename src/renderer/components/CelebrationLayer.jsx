import cn from 'classnames';
import { useUiStore } from '../store/uiStore';
import { Sparkles, Flame, Trophy } from 'lucide-react';

const SPARKLE_COLORS = [
  'var(--gold)',
  'var(--gold-light)',
  'var(--success-light)',
  '#ffffff',
];

const CONFETTI_COLORS = ['#d4af37', '#e8c547', '#7cb342', '#64b5f6', '#ef5350', '#ffffff'];

/**
 * Renders transient reward feedback: a burst of gold sparkles from the point of
 * completion, a full-screen confetti shower for milestones/level-ups, and a
 * bottom toast. Mounted once at the app root.
 */
export default function CelebrationLayer() {
  const { celebrateAt, toast, confettiKey, dismissToast } = useUiStore();

  return (
    <>
      {celebrateAt && (
        <div className="sparkle-layer" key={celebrateAt.key}>
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 14 + Math.random();
            const dist = 40 + Math.random() * 60;
            return (
              <span
                key={i}
                className="sparkle"
                style={{
                  left: celebrateAt.x,
                  top: celebrateAt.y,
                  background: SPARKLE_COLORS[i % SPARKLE_COLORS.length],
                  '--dx': `${Math.cos(angle) * dist}px`,
                  '--dy': `${Math.sin(angle) * dist - 20}px`,
                  animationDelay: `${Math.random() * 80}ms`,
                }}
              />
            );
          })}
        </div>
      )}

      {confettiKey && (
        <div className="confetti-layer" key={confettiKey}>
          {Array.from({ length: 44 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${Math.random() * 400}ms`,
                animationDuration: `${1.5 + Math.random() * 0.9}s`,
                '--spin': `${360 + Math.random() * 540}deg`,
              }}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className={cn('toast', { levelup: toast.variant === 'levelup' })} key={toast.id}>
          {toast.icon === 'flame' ? (
            <Flame size={16} color="var(--gold-text)" />
          ) : toast.icon === 'trophy' ? (
            <Trophy size={16} color="var(--gold-text)" />
          ) : (
            <Sparkles size={16} color="var(--gold-text)" />
          )}
          <span className="toast-message">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action.onClick();
                dismissToast();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}
