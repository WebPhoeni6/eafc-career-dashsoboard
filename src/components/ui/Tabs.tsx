import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, children }) => {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '');

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(34,48,74,0.6)', marginBottom: '16px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '9px 16px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${active === tab.id ? 'var(--accent)' : 'transparent'}`,
              color: active === tab.id ? 'var(--text)' : 'var(--muted)',
              fontWeight: active === tab.id ? 700 : 400,
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.18s, border-color 0.18s',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
};
