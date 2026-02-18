import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions }) => (
  <div
    className="page-header"
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {icon && (
        <div
          className="page-header__icon"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(145deg, rgba(16,185,129,0.22), rgba(14,165,233,0.16))',
            border: '1px solid var(--border)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--accent)',
          }}
        >
          {icon}
        </div>
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ margin: '3px 0 0', fontSize: 'clamp(12px, 2.8vw, 13px)', color: 'var(--muted)' }}>{subtitle}</p>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
  </div>
);
