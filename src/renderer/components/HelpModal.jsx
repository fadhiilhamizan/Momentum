import Modal from './Modal';

const SHORTCUTS = [
  ['Ctrl / ⌘ + N', 'New task (focus the input)'],
  ['Ctrl / ⌘ + T', 'Go to Today'],
  ['Ctrl / ⌘ + Shift + P', 'Go to Projects'],
  ['Ctrl / ⌘ + Shift + A', 'Go to Analytics'],
  ['Ctrl / ⌘ + ,', 'Open Settings'],
  ['Space', 'Focus the task input'],
  ['Enter', 'Add the task'],
  ['Esc', 'Close a dialog or focus session'],
  ['?', 'Open this help'],
];

const TIPS = [
  'Click a task to open its full details — notes, subtasks, tags, due date and recurrence.',
  'Use the “I have __ min” bar on Today to get a smart suggestion for what to do next.',
  'Drag the grip handle in All Tasks (Manual sort) to reorder your list.',
  'Complete something every day to keep your streak — and earn XP toward the next level.',
];

export default function HelpModal({ onClose }) {
  return (
    <Modal title="Help & shortcuts" onClose={onClose}>
      <div className="field">
        <span className="field-label">Keyboard shortcuts</span>
        <div>
          {SHORTCUTS.map(([keys, desc]) => (
            <div className="shortcut-row" key={keys}>
              <span className="shortcut-desc">{desc}</span>
              <kbd className="shortcut-keys">{keys}</kbd>
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Tips</span>
        <ul style={{ margin: 0, paddingLeft: 'var(--sp-5)', color: 'var(--text-2)', lineHeight: 1.6, fontSize: 'var(--fs-body-lg)' }}>
          {TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
