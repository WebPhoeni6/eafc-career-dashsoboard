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
    border: '1px solid rgba(124,92,255,0.35)',
    background: 'rgba(124,92,255,0.12)',
  },
  accent: {
    border: '1px solid rgba(124,92,255,0.6)',
    background: 'rgba(124,92,255,0.25)',
  },
  green: {
    border: '1px solid rgba(34,197,94,0.35)',
    background: 'rgba(34,197,94,0.12)',
  },
  danger: {
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.12)',
  },
  ghost: {
    border: '1px solid rgba(154,167,189,0.25)',
    background: 'rgba(255,255,255,0.04)',
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 10px', fontSize: '12px', borderRadius: '10px' },
  md: { padding: '9px 14px', fontSize: '13px', borderRadius: '12px' },
  lg: { padding: '11px 18px', fontSize: '14px', borderRadius: '14px' },
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
}) => {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        color: 'var(--text)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.06s ease',
        opacity: disabled ? 0.55 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading ? <span style={{ opacity: 0.7 }}>…</span> : icon}
      {children}
    </button>
  );
};
