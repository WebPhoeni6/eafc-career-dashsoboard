import React from 'react';

export const Footer: React.FC = () => (
  <footer
    style={{
      borderTop: '1px solid var(--border-muted)',
      padding: '10px 16px',
      fontSize: '11px',
      color: 'var(--muted)',
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      background: 'var(--panel-gradient)',
    }}
  >
    <span>FC26 Career Tracker v2.1.0</span>
    <span>• API connected</span>
    <span>• Use export files regularly</span>
    <span style={{ marginLeft: 'auto' }}>
      Shortcuts:{' '}
      <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>N</kbd> new match{' '}
      <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>/</kbd> search{' '}
      <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>E</kbd> export
    </span>
  </footer>
);
