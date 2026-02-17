import React from 'react';
import { Download, Trash2, Sun, Moon } from 'lucide-react';
import { useCareerStore } from '../../store/career.store';
import { useMatchesStore } from '../../store/matches.store';
import { useSkillsStore } from '../../store/skills.store';
import { useSeasonsStore } from '../../store/seasons.store';
import { useTransfersStore } from '../../store/transfers.store';
import { exportAllData } from '../../services/export/exportJson';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

export const Topbar: React.FC = () => {
  const { career, theme, setTheme } = useCareerStore();
  const matches = useMatchesStore((s) => s.matches);
  const toast = useToast((s) => s.show);

  const handleExport = () => {
    const skills = useSkillsStore.getState();
    const seasons = useSeasonsStore.getState();
    const transfers = useTransfersStore.getState();
    exportAllData({
      career,
      matches,
      trophies: seasons.trophies,
      skillSpends: skills.skillSpends,
      offers: transfers.offers,
      contracts: transfers.contracts,
    }, career?.playerName);
    toast('Exported JSON ✅', 'success');
  };

  const handleWipe = () => {
    if (!window.confirm('Wipe ALL data? This cannot be undone.')) return;
    localStorage.clear();
    window.location.reload();
  };

  return (
    <header style={{
      height: 'var(--topbar-h)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      borderBottom: '1px solid rgba(34,48,74,0.5)',
      background: 'rgba(11,15,23,0.7)',
      backdropFilter: 'blur(10px)',
      gap: '12px',
      flexShrink: 0,
    }}>
      {/* Left: player chips */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', overflow: 'hidden' }}>
        {career ? (
          <>
            <Chip label="Player" value={career.playerName} color="accent" />
            <Chip label="Club" value={career.club} />
            <Chip label="Season" value={career.season} />
            <Chip label="OVR" value={String(career.ovr)} color="green" />
            <Chip label="SP" value={String(career.spAvailable)} />
          </>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>No career set — go to Profile →</span>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <Button variant="ghost" size="sm" icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme" />
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={handleExport} title="Export JSON [E]">
          Export
        </Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleWipe} title="Wipe all data" />
      </div>
    </header>
  );
};

const Chip: React.FC<{ label: string; value: string; color?: 'accent' | 'green' }> = ({ label, value, color }) => (
  <div style={{
    padding: '4px 10px',
    borderRadius: '999px',
    background: color === 'accent' ? 'rgba(124,92,255,0.15)' : color === 'green' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${color === 'accent' ? 'rgba(124,92,255,0.3)' : color === 'green' ? 'rgba(34,197,94,0.3)' : 'rgba(34,48,74,0.8)'}`,
    fontSize: '12px',
    color: 'var(--muted)',
  }}>
    {label}: <strong style={{ color: 'var(--text)' }}>{value}</strong>
  </div>
);
