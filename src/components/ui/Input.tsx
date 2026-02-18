import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'rgba(5, 18, 14, 0.28)',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
  fontSize: '13px',
};

export const Input: React.FC<InputProps> = ({ label, error, hint, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {label && <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{label}</label>}
    <input
      {...rest}
      style={{
        ...inputStyle,
        ...(error ? { borderColor: 'rgba(239,68,68,0.6)' } : {}),
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.8)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.16)';
        e.currentTarget.style.background = 'rgba(10,32,24,0.34)';
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = 'rgba(5, 18, 14, 0.28)';
        rest.onBlur?.(e);
      }}
    />
    {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    {hint && !error && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{hint}</span>}
  </div>
);
