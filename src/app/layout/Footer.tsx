import React from 'react';

export const Footer: React.FC = () => (
  <footer style={{
    borderTop: '1px solid rgba(34,48,74,0.4)',
    padding: '10px 20px',
    fontSize: '11px',
    color: 'var(--muted)',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  }}>
    <span>FC 26 Career Tracker v2.0.0</span>
    <span>• Data stored in your browser (LocalStorage)</span>
    <span>• Export JSON regularly as backup</span>
    <span style={{ marginLeft: 'auto' }}>
      Shortcuts: <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>N</kbd> new match &nbsp;
      <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>/</kbd> search &nbsp;
      <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>E</kbd> export
    </span>
  </footer>
);
