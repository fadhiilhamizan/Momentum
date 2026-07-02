import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Calendar, ListChecks, Star, Folder, BarChart3,
  NotebookPen, Settings, Info, Plus, CircleHelp,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useUiStore } from '../store/uiStore';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

/**
 * Ctrl/Cmd-K command palette: fuzzy-jump to any view, trigger quick actions, or
 * search open tasks and jump straight into a task's detail. Keyboard-first
 * (arrows to move, Enter to run, Esc to close) with mouse support.
 */
export default function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const close = useUiStore((s) => s.closePalette);
  const openHelp = useUiStore((s) => s.openHelp);
  const openTask = useUiStore((s) => s.openTask);
  const tasks = useTaskStore((s) => s.tasks);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const go = (path) => () => {
      navigate(path);
      close();
    };
    return [
      {
        id: 'new',
        label: 'New task',
        hint: 'Create',
        Icon: Plus,
        run: () => {
          navigate('/today');
          close();
          setTimeout(() => {
            const el = document.querySelector('.task-input input.title');
            if (el) el.focus();
          }, 40);
        },
      },
      { id: 'today', label: 'Go to Today', hint: 'View', Icon: Calendar, run: go('/today') },
      { id: 'tasks', label: 'Go to All Tasks', hint: 'View', Icon: ListChecks, run: go('/tasks') },
      { id: 'starred', label: 'Go to Starred', hint: 'View', Icon: Star, run: go('/starred') },
      { id: 'projects', label: 'Go to Projects', hint: 'View', Icon: Folder, run: go('/projects') },
      { id: 'analytics', label: 'Go to Analytics', hint: 'View', Icon: BarChart3, run: go('/analytics') },
      { id: 'reflection', label: 'Go to Reflection', hint: 'View', Icon: NotebookPen, run: go('/reflection') },
      { id: 'settings', label: 'Go to Settings', hint: 'View', Icon: Settings, run: go('/settings') },
      { id: 'about', label: 'Go to About', hint: 'View', Icon: Info, run: go('/about') },
      {
        id: 'help',
        label: 'Keyboard shortcuts',
        hint: 'Help',
        Icon: CircleHelp,
        run: () => {
          close();
          openHelp();
        },
      },
    ];
  }, [navigate, close, openHelp]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cmds = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
    const taskMatches = (
      q ? tasks.filter((t) => !t.isCompleted && t.title.toLowerCase().includes(q)) : []
    )
      .slice(0, 6)
      .map((t) => ({
        id: `task-${t.id}`,
        label: t.title,
        hint: 'Task',
        Icon: ListChecks,
        run: () => {
          openTask(t.id);
          close();
        },
      }));
    return [...cmds, ...taskMatches];
  }, [query, commands, tasks, openTask, close]);

  // Focus the input and reset each time the palette opens.
  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(0);
    lockScroll();
    const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 20);
    return () => {
      clearTimeout(id);
      unlockScroll();
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted row in view when navigating with the keyboard.
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('.cp-item.active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[active];
      if (r) r.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <div
      className="modal-overlay palette-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cp-search">
          <Search size={16} />
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Search tasks and commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search tasks and commands"
          />
          <kbd className="cp-esc">Esc</kbd>
        </div>
        <div className="cp-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="cp-empty">No matches</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={`cp-item${i === active ? ' active' : ''}`}
                onMouseMove={() => setActive(i)}
                onClick={() => r.run()}
              >
                <r.Icon size={15} className="cp-item-icon" />
                <span className="cp-item-label">{r.label}</span>
                <span className="cp-item-hint">{r.hint}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
