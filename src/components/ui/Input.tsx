import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: '11px',
  border: '1px solid rgba(34,48,74,0.9)',
  background: 'rgba(5,9,16,0.35)',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  fontSize: '13px',
};

export const Input: React.FC<InputProps> = ({ label, error, hint, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {label && (
      <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
        {label}
      </label>
    )}
    <input
      {...rest}
      style={{
        ...inputStyle,
        ...(error ? { borderColor: 'rgba(239,68,68,0.6)' } : {}),
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(124,92,255,0.65)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,92,255,0.12)';
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(34,48,74,0.9)';
        e.currentTarget.style.boxShadow = 'none';
        rest.onBlur?.(e);
      }}
    />
    {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
    {hint && !error && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{hint}</span>}
  </div>
);
