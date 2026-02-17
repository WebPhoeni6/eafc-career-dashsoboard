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
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: `min(${width}, 96vw)`,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(16,24,42,0.98), rgba(15,23,41,0.98))',
          border: '1px solid rgba(34,48,74,0.85)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(34,48,74,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
        {actions && (
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(34,48,74,0.7)',
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
          }}>
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
