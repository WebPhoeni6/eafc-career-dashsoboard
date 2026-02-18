import React from 'react';
import { Download, LogOut, Sun, Moon, Trash2, Search, Bell, Mail } from 'lucide-react';
import { useCareerStore } from '../../store/career.store';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { downloadCareerExport } from '../../services/api/sync.api';
import { useSessionStore } from '../../store/session.store';
import { hydrateActiveCareerModules } from '../../services/api/hydrate';

export const Topbar: React.FC = () => {
  const { career, activeCareerId, theme, setTheme } = useCareerStore();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const toast = useToast((s) => s.show);

  const handleExport = async () => {
    if (!activeCareerId) {
      toast('No active career to export', 'error');
      return;
    }
    try {
      await downloadCareerExport(activeCareerId, career?.playerName);
      toast('Exported JSON file', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const handleDeleteCareer = async () => {
    if (!window.confirm('Delete active career and all linked records?')) return;
    try {
      await useCareerStore.getState().clearCareer();
      await hydrateActiveCareerModules();
      toast('Career deleted', 'default');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast('Logged out', 'default');
  };

  const initials = (user?.username || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel-gradient)',
        backdropFilter: 'blur(8px)',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid var(--border-muted)',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '999px',
          padding: '8px 12px',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <Search size={15} color="var(--muted)" />
        <input
          placeholder="Search matches, clubs, competitions..."
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text)',
            width: '100%',
            outline: 'none',
            fontSize: '13px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <button style={iconButtonStyle}><Mail size={15} /></button>
        <button style={iconButtonStyle}><Bell size={15} /></button>
        <Button
          variant="ghost"
          size="sm"
          icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        />
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => { void handleExport(); }} title="Export JSON [E]">
          Export
        </Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => { void handleDeleteCareer(); }} title="Delete active career" />
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={() => { void handleLogout(); }} title="Logout" />
      </div>

      <div
        style={{
          marginLeft: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          borderRadius: '12px',
          border: '1px solid var(--border-muted)',
          background: 'rgba(255,255,255,0.04)',
          minWidth: '170px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, rgba(16,185,129,0.9), rgba(14,165,233,0.75))',
            color: '#f2fffb',
            display: 'grid',
            placeItems: 'center',
            fontSize: '12px',
            fontWeight: 800,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.username || 'Manager'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email || 'manager@fc26.local'}
          </div>
        </div>
      </div>
    </header>
  );
};

const iconButtonStyle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: '10px',
  border: '1px solid var(--border-muted)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--muted)',
  display: 'grid',
  placeItems: 'center',
};
