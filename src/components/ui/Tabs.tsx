import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, activeTab, onChange, children }) => {
  const [internalActive, setInternalActive] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const active = activeTab ?? internalActive;

  const setActive = (tabId: string) => {
    if (activeTab === undefined) setInternalActive(tabId);
    onChange?.(tabId);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-muted)', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '9px 14px',
              background: active === tab.id ? 'rgba(16,185,129,0.18)' : 'transparent',
              border: `1px solid ${active === tab.id ? 'var(--border)' : 'transparent'}`,
              borderBottom: `2px solid ${active === tab.id ? 'var(--accent)' : 'transparent'}`,
              color: active === tab.id ? 'var(--text)' : 'var(--muted)',
              borderRadius: '10px 10px 0 0',
              fontWeight: active === tab.id ? 700 : 500,
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition)',
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
