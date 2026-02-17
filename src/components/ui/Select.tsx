import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: '11px',
  border: '1px solid rgba(34,48,74,0.9)',
  background: 'rgba(5,9,16,0.55)',
  color: 'var(--text)',
  outline: 'none',
  fontSize: '13px',
  cursor: 'pointer',
};

export const Select: React.FC<SelectProps> = ({ label, error, options, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {label && (
      <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
        {label}
      </label>
    )}
    <select
      {...rest}
      style={{ ...selectStyle, ...(error ? { borderColor: 'rgba(239,68,68,0.6)' } : {}), ...style }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
  </div>
);
