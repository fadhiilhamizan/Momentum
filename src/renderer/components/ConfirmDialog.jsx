import Modal from './Modal';

/** A small confirm dialog for destructive actions. */
export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onClose,
}) {
  const footer = (
    <>
      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
      <button
        className="btn btn-primary"
        style={danger ? { background: 'var(--priority-critical)', color: '#fff' } : undefined}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </button>
    </>
  );
  return (
    <Modal title={title} onClose={onClose} footer={footer}>
      <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-body-lg)', lineHeight: 1.5 }}>
        {message}
      </div>
    </Modal>
  );
}
