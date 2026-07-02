import { useEffect } from 'react';
import { X } from 'lucide-react';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

/** A centered modal with an overlay. Closes on Escape or overlay click. */
export default function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    lockScroll();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      unlockScroll();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="icon-btn" onClick={onClose} title="Close (Esc)" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
