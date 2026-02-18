import React from 'react';
import { useToast } from '../../hooks/useToast';

const typeColors: Record<string, string> = {
  default: 'var(--panel)',
  success: 'rgba(16, 100, 70, 0.9)',
  error: 'rgba(96, 24, 24, 0.92)',
  achievement: 'rgba(14, 78, 88, 0.92)',
};

const typeBorders: Record<string, string> = {
  default: 'var(--border)',
  success: 'rgba(34,197,94,0.45)',
  error: 'rgba(239,68,68,0.45)',
  achievement: 'rgba(14,165,233,0.45)',
};

export const Toast: React.FC = () => {
  const { message, visible, type } = useToast();

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '22px',
        transform: `translateX(-50%) translateY(${visible ? '0' : '12px'})`,
        background: typeColors[type] ?? typeColors.default,
        border: `1px solid ${typeBorders[type] ?? typeBorders.default}`,
        padding: '10px 16px',
        borderRadius: '14px',
        boxShadow: 'var(--shadow)',
        maxWidth: 'min(720px, 92vw)',
        color: 'var(--text)',
        zIndex: 9999,
        fontSize: '13px',
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
};
