import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Swords,
  CalendarDays,
  Dumbbell,
  ArrowLeftRight,
  Globe2,
  User,
  Settings,
} from 'lucide-react';
import crest from '../../assets/brand/crest.svg';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/matches', label: 'Matches', icon: Swords },
  { to: '/seasons', label: 'Seasons', icon: CalendarDays },
  { to: '/skills', label: 'Skills', icon: Dumbbell },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/international', label: 'International', icon: Globe2 },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => (
  <aside
    style={{
      width: 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--panel-gradient)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '14px',
      backdropFilter: 'blur(8px)',
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border-muted)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={crest} alt="FC Career Tracker" style={{ width: '38px', height: '38px' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em' }}>Career Tracker</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>FC26 Manager Hub</div>
        </div>
      </div>
    </div>

    <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            padding: '10px 13px',
            borderRadius: '12px',
            color: isActive ? 'var(--text)' : 'var(--muted)',
            background: isActive ? 'linear-gradient(90deg, rgba(16,185,129,0.24), rgba(20,184,166,0.15))' : 'transparent',
            border: isActive ? '1px solid var(--border)' : '1px solid transparent',
            fontWeight: isActive ? 700 : 500,
            fontSize: '13px',
            transition: 'all var(--transition)',
            textDecoration: 'none',
          })}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>

    <div style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--muted)', borderTop: '1px solid var(--border-muted)' }}>
      v2.1.0 • Cloud Sync Ready
    </div>
  </aside>
);
