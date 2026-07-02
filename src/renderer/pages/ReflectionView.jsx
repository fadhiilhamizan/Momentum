import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, NotebookPen } from 'lucide-react';
import api from '../utils/api';
import { useUiStore } from '../store/uiStore';
import { todayKey, fullDate } from '../utils/dateHelpers';
import EmptyState from '../components/EmptyState';

const PROMPTS = [
  { key: 'wins', emoji: '🏆', label: 'A win from today', placeholder: 'What went well?' },
  { key: 'learnings', emoji: '💡', label: 'Something you learned', placeholder: 'An insight or lesson…' },
  { key: 'tomorrow', emoji: '🎯', label: 'Focus for tomorrow', placeholder: 'What matters most next?' },
];

const MOODS = ['😔', '😐', '🙂', '😄', '🔥'];

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
          mood: r.mood || null,
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
              <span className="emoji">{p.emoji}</span> {p.label}
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
                key={m}
                className={`mood-btn${entry.mood === m ? ' selected' : ''}`}
                onClick={() => set('mood', entry.mood === m ? null : m)}
              >
                {m}
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
                {format(parseISO(r.date), 'EEEE, MMM d')} {r.mood || ''}
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-body)', lineHeight: 1.5 }}>
                {r.wins && <div>🏆 {r.wins}</div>}
                {r.learnings && <div>💡 {r.learnings}</div>}
                {r.tomorrow && <div>🎯 {r.tomorrow}</div>}
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
