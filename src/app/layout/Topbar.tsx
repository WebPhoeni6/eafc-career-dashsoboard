import React from 'react';
import { Download, LogOut, Sun, Moon, Trash2, Search, Bell, Mail, Menu } from 'lucide-react';
import { useCareerStore } from '../../store/career.store';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { downloadCareerExport } from '../../services/api/sync.api';
import { useSessionStore } from '../../store/session.store';
import { hydrateActiveCareerModules } from '../../services/api/hydrate';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
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
    <header className="topbar">
      <button
        type="button"
        className="topbar-menu-btn"
        style={iconButtonStyle}
        onClick={onMenuToggle}
        aria-label="Open navigation"
      >
        <Menu size={16} />
      </button>

      <div className="topbar-search" style={searchStyle}>
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

      <div className="topbar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button className="topbar-hide-sm" style={iconButtonStyle} aria-label="Messages">
          <Mail size={15} />
        </button>
        <button className="topbar-hide-sm" style={iconButtonStyle} aria-label="Notifications">
          <Bell size={15} />
        </button>

        <Button
          variant="ghost"
          size="sm"
          icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        />

        <Button
          className="topbar-hide-md"
          variant="ghost"
          size="sm"
          icon={<Download size={14} />}
          onClick={() => {
            void handleExport();
          }}
          title="Export JSON [E]"
        >
          Export
        </Button>

        <Button
          className="topbar-hide-md"
          variant="danger"
          size="sm"
          icon={<Trash2 size={14} />}
          onClick={() => {
            void handleDeleteCareer();
          }}
          title="Delete active career"
        />

        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut size={14} />}
          onClick={() => {
            void handleLogout();
          }}
          title="Logout"
        />
      </div>

      <div className="topbar-user" style={userCardStyle}>
        <div style={avatarStyle}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.username || 'Manager'}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.email || 'manager@fc26.local'}
          </div>
        </div>
      </div>
    </header>
  );
};

const searchStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  border: '1px solid var(--border-muted)',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '999px',
  padding: '8px 12px',
  width: '100%',
  maxWidth: '420px',
};

const userCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px',
  borderRadius: '12px',
  border: '1px solid var(--border-muted)',
  background: 'rgba(255,255,255,0.04)',
  minWidth: '170px',
};

const avatarStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'linear-gradient(145deg, rgba(16,185,129,0.9), rgba(14,165,233,0.75))',
  color: '#f2fffb',
  display: 'grid',
  placeItems: 'center',
  fontSize: '12px',
  fontWeight: 800,
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
