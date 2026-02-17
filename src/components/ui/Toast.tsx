import React from 'react';
import { useToast } from '../../hooks/useToast';

const typeColors: Record<string, string> = {
  default:     'rgba(12,18,32,0.95)',
  success:     'rgba(16,40,24,0.95)',
  error:       'rgba(40,14,14,0.95)',
  achievement: 'rgba(20,14,40,0.95)',
};

const typeBorders: Record<string, string> = {
  default:     'rgba(34,48,74,0.8)',
  success:     'rgba(34,197,94,0.4)',
  error:       'rgba(239,68,68,0.4)',
  achievement: 'rgba(124,92,255,0.5)',
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
