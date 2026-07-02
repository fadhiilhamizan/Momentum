import { useEffect } from 'react';
import { Flame, Target, Timer, BarChart3, ArrowRight } from 'lucide-react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const FEATURES = [
  { icon: Target, title: 'Plan by energy', desc: 'Match tasks to how you feel: low, medium or high energy.' },
  { icon: Timer, title: 'Focus sessions', desc: 'A built-in Pomodoro timer to help you get into deep work.' },
  { icon: Flame, title: 'Build streaks', desc: 'Finish something each day and watch your streak grow.' },
  { icon: BarChart3, title: 'See your progress', desc: 'Charts, heatmaps and insights into your momentum.' },
];

/** First-run onboarding. Warmly introduces what the app is for. */
export default function Welcome({ onFinish }) {
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);

  return (
    <div className="modal-overlay">
      <div className="welcome-card">
        <div className="welcome-hero">
          <div className="brand-mark" style={{ width: 56, height: 56 }}>
            <Flame size={28} />
          </div>
          <div className="welcome-title">
            Welcome to Mo<span style={{ color: 'var(--gold-text)' }}>mentum</span>
          </div>
          <div className="welcome-sub">
            A calm, rewarding way to get things done. Here's what makes it tick:
          </div>
        </div>

        <div className="welcome-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div className="welcome-feature" key={f.title}>
                <div className="wf-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="wf-title">{f.title}</div>
                  <div className="wf-desc">{f.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary welcome-cta" onClick={onFinish}>
          Get started <ArrowRight size={16} />
        </button>
        <div className="welcome-tip">
          Tip: press <kbd>?</kbd> anytime to see keyboard shortcuts.
        </div>
      </div>
    </div>
  );
}
