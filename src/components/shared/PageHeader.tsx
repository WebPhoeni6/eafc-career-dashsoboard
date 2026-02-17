import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon, actions }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {icon && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'rgba(124,92,255,0.15)',
          display: 'grid', placeItems: 'center', color: 'var(--accent)',
        }}>
          {icon}
        </div>
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{title}</h1>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted)' }}>{subtitle}</p>}
      </div>
    </div>
    {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
  </div>
);
