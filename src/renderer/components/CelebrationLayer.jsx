import { useUiStore } from '../store/uiStore';
import { Sparkles, Flame } from 'lucide-react';

const SPARKLE_COLORS = [
  'var(--gold)',
  'var(--gold-light)',
  'var(--success-light)',
  '#ffffff',
];

/**
 * Renders transient reward feedback: a burst of gold sparkles from the point of
 * completion, plus a bottom toast. Mounted once at the app root.
 */
export default function CelebrationLayer() {
  const { celebrateAt, toast } = useUiStore();

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

      {toast && (
        <div className="toast" key={toast.id}>
          {toast.icon === 'flame' ? (
            <Flame size={16} color="var(--gold)" />
          ) : (
            <Sparkles size={16} color="var(--gold)" />
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}
