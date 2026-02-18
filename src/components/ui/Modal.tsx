import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = '720px', actions }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 10, 8, 0.62)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '12px',
        zIndex: 1000,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          width: `min(${width}, 96vw)`,
          maxHeight: 'calc(100dvh - 24px)',
          marginTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--panel-gradient)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                padding: '2px 6px',
              }}
            >
              x
            </button>
          </div>
        )}
        <div style={{ padding: 'clamp(12px, 2vw, 18px)', overflowY: 'auto', flex: 1 }}>{children}</div>
        {actions && (
          <div
            style={{
              padding: '12px clamp(12px, 2vw, 18px)',
              borderTop: '1px solid var(--border-muted)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
