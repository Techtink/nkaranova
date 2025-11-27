import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import './Modal.scss';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div className="modal-header">
            {title && <h3 className="modal-title">{title}</h3>}
            {showClose && (
              <button className="modal-close" onClick={onClose}>
                <FiX />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
