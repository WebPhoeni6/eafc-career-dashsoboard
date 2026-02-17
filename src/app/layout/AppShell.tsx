import React, { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
import { Modal } from '../../components/ui/Modal';
import { MatchForm } from '../../components/forms/MatchForm/MatchForm';
import { useMatchesStore } from '../../store/matches.store';
import { useCareerStore } from '../../store/career.store';
import { useToast } from '../../hooks/useToast';
import { exportAllData } from '../../services/export/exportJson';

export const AppShell: React.FC = () => {
  const [newMatchOpen, setNewMatchOpen] = useState(false);
  const addMatch = useMatchesStore((s) => s.addMatch);
  const matches = useMatchesStore((s) => s.matches);
  const { career, checkAchievements, backupMatchThreshold, lastBackupMatchCount, setLastBackupCount } = useCareerStore();
  const toast = useToast((s) => s.show);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'n' || e.key === 'N') { setNewMatchOpen(true); return; }
      if (e.key === 'e' || e.key === 'E') {
        exportAllData({ career, matches }, career?.playerName);
        toast('Exported JSON ✅', 'success');
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        // Focus search input if on matches page
        const searchEl = document.getElementById('match-search') as HTMLInputElement | null;
        searchEl?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [career, matches, toast]);

  const handleAddMatch = (m: Parameters<typeof addMatch>[0]) => {
    if (!career) { toast('Set your career profile first', 'error'); return; }
    const newMatch = addMatch(m);
    setNewMatchOpen(false);
    toast('Match added ✅', 'success');

    // Update career OVR/SP if provided
    if (m.ovrAfter !== '') useCareerStore.setState((s) => ({ career: s.career ? { ...s.career, ovr: Number(m.ovrAfter) } : null }));
    if (m.spAfter !== '') useCareerStore.setState((s) => ({ career: s.career ? { ...s.career, spAvailable: Number(m.spAfter) } : null }));

    // Achievement check
    const allMatches = [...matches, newMatch];
    const totalGoals = allMatches.reduce((s, x) => s + (x.goals ?? 0), 0);
    const newKeys = checkAchievements({
      totalGoals,
      totalMatches: allMatches.length,
      totalMotm: allMatches.filter((x) => x.motm).length,
      totalClutch: allMatches.filter((x) => x.clutchMoment).length,
      hatTricks: allMatches.filter((x) => x.goals >= 3).length,
      hasRating10: allMatches.some((x) => x.matchRating >= 10),
      hasScoredUCLKO: allMatches.some((x) => x.goals > 0 && (x.competition === 'UCL' || x.competition === 'UEL') && x.stage !== 'N/A' && x.stage !== 'Group'),
      gaStreak: 0,
      maxDribblesInMatch: Math.max(...allMatches.map((x) => x.dribblesCompleted ?? 0), 0),
    });
    if (newKeys.length) {
      const def = useCareerStore.getState().achievements.find((a) => a.key === newKeys[0]);
      if (def) toast(`🏆 Achievement unlocked: ${def.label}`, 'achievement', 3500);
    }

    // Backup prompt
    const count = allMatches.length;
    if (count - lastBackupMatchCount >= backupMatchThreshold) {
      toast(`💾 ${count} matches logged — consider exporting a backup!`, 'default', 4000);
      setLastBackupCount(count);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <Outlet context={{ openNewMatch: () => setNewMatchOpen(true), searchRef }} />
        </main>
        <Footer />
      </div>

      <Modal open={newMatchOpen} onClose={() => setNewMatchOpen(false)} title="Add Match" width="900px">
        <MatchForm onSubmit={handleAddMatch} onCancel={() => setNewMatchOpen(false)} />
      </Modal>
    </div>
  );
};
