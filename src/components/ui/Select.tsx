import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'rgba(5, 18, 14, 0.55)',
  color: 'var(--text)',
  outline: 'none',
  fontSize: '13px',
  cursor: 'pointer',
};

export const Select: React.FC<SelectProps> = ({ label, error, options, style, ...rest }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {label && <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{label}</label>}
    <select {...rest} style={{ ...selectStyle, ...(error ? { borderColor: 'rgba(239,68,68,0.6)' } : {}), ...style }}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>}
  </div>
);
