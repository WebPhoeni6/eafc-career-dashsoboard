import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Swords, CalendarDays, Dumbbell,
  ArrowLeftRight, Globe2, User, Settings,
} from 'lucide-react';

const navItems = [
  { to: '/',               label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/matches',        label: 'Matches',        icon: Swords },
  { to: '/seasons',        label: 'Seasons',        icon: CalendarDays },
  { to: '/skills',         label: 'Skills',         icon: Dumbbell },
  { to: '/transfers',      label: 'Transfers',      icon: ArrowLeftRight },
  { to: '/international',  label: 'International',  icon: Globe2 },
  { to: '/profile',        label: 'Profile',        icon: User },
  { to: '/settings',       label: 'Settings',       icon: Settings },
];

export const Sidebar: React.FC = () => (
  <aside style={{
    width: 'var(--sidebar-w)',
    minHeight: '100vh',
    background: 'rgba(10,14,24,0.7)',
    borderRight: '1px solid rgba(34,48,74,0.5)',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '14px',
    backdropFilter: 'blur(8px)',
    flexShrink: 0,
  }}>
    {/* Logo */}
    <div style={{ padding: '0 16px 20px', borderBottom: '1px solid rgba(34,48,74,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(124,92,255,0.9), rgba(34,197,94,0.8))',
          display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '13px',
        }}>FC</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px' }}>FC 26 Tracker</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Career Mode</div>
        </div>
      </div>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            color: isActive ? 'var(--text)' : 'var(--muted)',
            background: isActive ? 'rgba(124,92,255,0.15)' : 'transparent',
            fontWeight: isActive ? 600 : 400,
            fontSize: '13px',
            transition: 'background 0.18s, color 0.18s',
            textDecoration: 'none',
          })}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>

    <div style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--muted)', borderTop: '1px solid rgba(34,48,74,0.4)' }}>
      v2.0.0 • LocalStorage
    </div>
  </aside>
);
