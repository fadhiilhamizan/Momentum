import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, NotebookPen, Trophy, Lightbulb, Target, Frown, Meh, Smile, Laugh, Flame } from 'lucide-react';
import api from '../utils/api';
import { useUiStore } from '../store/uiStore';
import { todayKey, fullDate } from '../utils/dateHelpers';
import EmptyState from '../components/EmptyState';

const PROMPTS = [
  { key: 'wins', Icon: Trophy, label: 'A win from today', placeholder: 'What went well?' },
  { key: 'learnings', Icon: Lightbulb, label: 'Something you learned', placeholder: 'An insight or lesson…' },
  { key: 'tomorrow', Icon: Target, label: 'Focus for tomorrow', placeholder: 'What matters most next?' },
];

// Mood scale — stored as a stable key so it renders as an icon everywhere.
const MOODS = [
  { key: 'rough', Icon: Frown, label: 'Rough' },
  { key: 'meh', Icon: Meh, label: 'Meh' },
  { key: 'okay', Icon: Smile, label: 'Okay' },
  { key: 'good', Icon: Laugh, label: 'Good' },
  { key: 'great', Icon: Flame, label: 'On fire' },
];

// Map any legacy emoji-based moods to the new keys so old entries still render.
const LEGACY_MOOD = { '😔': 'rough', '😐': 'meh', '🙂': 'okay', '😄': 'good', '🔥': 'great' };

/** Render the icon for a stored mood value (new key or legacy emoji). */
function MoodIcon({ value, size = 16 }) {
  if (!value) return null;
  const mood = MOODS.find((m) => m.key === (LEGACY_MOOD[value] || value));
  if (!mood) return null;
  const Icon = mood.Icon;
  return <Icon size={size} />;
}

export default function ReflectionView() {
  const showToast = useUiStore((s) => s.showToast);
  const [entry, setEntry] = useState({ wins: '', learnings: '', tomorrow: '', mood: null });
  const [history, setHistory] = useState([]);
  const today = todayKey();

  const loadHistory = () => api.reflections.list(30).then(setHistory);

  useEffect(() => {
    api.reflections.getByDate(today).then((r) => {
      if (r) {
        setEntry({
          wins: r.wins || '',
          learnings: r.learnings || '',
          tomorrow: r.tomorrow || '',
          mood: r.mood ? LEGACY_MOOD[r.mood] || r.mood : null,
        });
      }
    });
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    await api.reflections.upsert({ date: today, ...entry });
    await loadHistory();
    showToast('Reflection saved', 'sparkles');
  };

  const set = (key, value) => setEntry((e) => ({ ...e, [key]: value }));

  return (
    <div className="view">
      <div className="view-head">
        <div className="view-title">Reflection</div>
        <div className="view-subtitle">{fullDate()} — a quiet moment to close the day</div>
      </div>

      <div className="panel" style={{ marginBottom: 'var(--sp-4)' }}>
        {PROMPTS.map((p) => (
          <div className="reflect-prompt" key={p.key}>
            <div className="q">
              <p.Icon size={16} className="q-icon" /> {p.label}
            </div>
            <textarea
              className="textarea"
              placeholder={p.placeholder}
              value={entry[p.key]}
              onChange={(e) => set(p.key, e.target.value)}
            />
          </div>
        ))}

        <div className="reflect-prompt">
          <div className="q">How are you feeling?</div>
          <div className="mood-row">
            {MOODS.map((m) => (
              <button
                key={m.key}
                className={`mood-btn${entry.mood === m.key ? ' selected' : ''}`}
                onClick={() => set('mood', entry.mood === m.key ? null : m.key)}
                title={m.label}
                aria-label={m.label}
              >
                <m.Icon size={20} />
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-2)' }}>
          <button className="btn btn-primary" onClick={save}>
            <Check size={15} /> Save reflection
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <NotebookPen size={15} color="var(--gold-text)" /> Your reflections
        </div>
        {history.length > 0 ? (
          history.map((r) => (
            <div className="reflect-history-item" key={r.id || r.date}>
              <div className="reflect-date">
                {r.date === today ? 'Today · ' : ''}
                {format(parseISO(r.date), 'EEEE, MMM d')}
                {r.mood && (
                  <span className="reflect-mood">
                    <MoodIcon value={r.mood} size={14} />
                  </span>
                )}
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-body)', lineHeight: 1.5 }}>
                {r.wins && <div className="reflect-line"><Trophy size={13} /> <span>{r.wins}</span></div>}
                {r.learnings && <div className="reflect-line"><Lightbulb size={13} /> <span>{r.learnings}</span></div>}
                {r.tomorrow && <div className="reflect-line"><Target size={13} /> <span>{r.tomorrow}</span></div>}
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-3)', padding: 'var(--sp-4) 0' }}>
            Save your first reflection above and it will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
