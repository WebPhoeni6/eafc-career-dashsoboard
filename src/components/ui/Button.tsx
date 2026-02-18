import React from 'react';

type Variant = 'default' | 'green' | 'danger' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  default: {
    border: '1px solid var(--border)',
    background: 'rgba(16,185,129,0.12)',
  },
  accent: {
    border: '1px solid rgba(16,185,129,0.6)',
    background: 'linear-gradient(90deg, rgba(16,185,129,0.24), rgba(20,184,166,0.2))',
  },
  green: {
    border: '1px solid rgba(16,185,129,0.7)',
    background: 'linear-gradient(90deg, rgba(16,185,129,0.9), rgba(20,184,166,0.75))',
    color: '#eafff7',
  },
  danger: {
    border: '1px solid rgba(239,68,68,0.45)',
    background: 'rgba(239,68,68,0.12)',
  },
  ghost: {
    border: '1px solid var(--border-muted)',
    background: 'rgba(255,255,255,0.04)',
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '7px 12px', fontSize: '12px', borderRadius: '10px' },
  md: { padding: '10px 15px', fontSize: '13px', borderRadius: '12px' },
  lg: { padding: '12px 18px', fontSize: '14px', borderRadius: '14px' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading,
  icon,
  children,
  style,
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    style={{
      ...variantStyles[variant],
      ...sizeStyles[size],
      color: variant === 'green' ? '#eafff7' : 'var(--text)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      transition: 'all var(--transition)',
      boxShadow: variant === 'green' ? '0 8px 18px rgba(16,185,129,0.24)' : 'none',
      opacity: disabled ? 0.55 : 1,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {loading ? <span style={{ opacity: 0.7 }}>...</span> : icon}
    {children}
  </button>
);
