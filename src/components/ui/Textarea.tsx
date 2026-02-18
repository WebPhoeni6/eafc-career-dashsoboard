import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {label && <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{label}</label>}
    <textarea
      {...rest}
      style={{
        width: '100%',
        minHeight: '80px',
        padding: '10px 12px',
        borderRadius: '12px',
        border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'var(--border)'}`,
        background: 'rgba(5, 18, 14, 0.35)',
        color: 'var(--text)',
        outline: 'none',
        fontSize: '13px',
        resize: 'vertical',
        fontFamily: 'inherit',
        ...style,
      }}
    />
    {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
  </div>
);
