import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
    {icon && <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>}
    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{title}</div>
    {description && <div style={{ fontSize: '13px', marginBottom: '16px' }}>{description}</div>}
    {action}
  </div>
);
