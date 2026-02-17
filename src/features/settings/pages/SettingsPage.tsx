import React, { useState } from 'react';
import { useCareerStore } from '../../../store/career.store';
import { useMatchesStore } from '../../../store/matches.store';
import { useSeasonsStore } from '../../../store/seasons.store';
import { useSkillsStore } from '../../../store/skills.store';
import { useTransfersStore } from '../../../store/transfers.store';
import { exportAllData } from '../../../services/export/exportJson';
import { parseImport } from '../../../services/export/importJson';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Settings, Download, Upload, Trash2, Sun, Moon } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export const SettingsPage: React.FC = () => {
  const { career, theme, setTheme, backupMatchThreshold, setBackupThreshold } = useCareerStore();
  const { matches, importMatches } = useMatchesStore();
  const toast = useToast((s) => s.show);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    const skills = useSkillsStore.getState();
    const seasons = useSeasonsStore.getState();
    const transfers = useTransfersStore.getState();
    exportAllData({
      career,
      matches,
      trophies: seasons.trophies,
      challenges: seasons.challenges,
      narrativeTags: seasons.narrativeTags,
      skillSpends: skills.skillSpends,
      attributeTargets: skills.attributeTargets,
      offers: transfers.offers,
      contracts: transfers.contracts,
      agentNotes: transfers.agentNotes,
    }, career?.playerName);
    toast('Exported JSON ✅', 'success');
  };

  const handleImport = () => {
    const result = parseImport(importText);
    if (!result.valid || !result.data) {
      setImportError(result.errors.join('\n'));
      return;
    }
    const d = result.data;
    if (d.career) useCareerStore.setState({ career: d.career as never });
    if (Array.isArray(d.matches)) importMatches(d.matches as never);
    if (Array.isArray(d.trophies)) useSeasonsStore.setState({ trophies: d.trophies as never });
    if (Array.isArray(d.skillSpends)) useSkillsStore.setState({ skillSpends: d.skillSpends as never });
    if (Array.isArray(d.offers)) useTransfersStore.setState({ offers: d.offers as never });
    setImportOpen(false);
    setImportError('');
    setImportText('');
    toast('Imported successfully ✅', 'success');
  };

  const handleWipe = () => {
    if (!window.confirm('Wipe ALL data? This cannot be undone.')) return;
    localStorage.clear();
    window.location.reload();
  };

  const card = (title: string, children: React.ReactNode) => (
    <div style={{ background: 'linear-gradient(180deg,rgba(16,24,42,0.92),rgba(15,23,41,0.92))', border: '1px solid rgba(34,48,74,0.75)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="Settings" subtitle="Export, import, theme, backup & data management" icon={<Settings size={18} />} />

      {/* Theme */}
      {card('Appearance', (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Current theme:</span>
          <Button
            variant={theme === 'dark' ? 'accent' : 'ghost'}
            size="sm"
            icon={<Moon size={13} />}
            onClick={() => setTheme('dark')}
          >Dark</Button>
          <Button
            variant={theme === 'light' ? 'accent' : 'ghost'}
            size="sm"
            icon={<Sun size={13} />}
            onClick={() => setTheme('light')}
          >Light</Button>
        </div>
      ))}

      {/* Backup */}
      {card('Auto-Backup Reminder', (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Remind me every</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={backupMatchThreshold}
            onChange={(e) => setBackupThreshold(Number(e.target.value))}
            style={{ width: '70px' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>matches</span>
        </div>
      ))}

      {/* Export/Import */}
      {card('Data Export / Import', (
        <>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            You have <strong style={{ color: 'var(--text)' }}>{matches.length} matches</strong> stored. Export regularly to prevent data loss.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="green" icon={<Download size={14} />} onClick={handleExport}>
              Export All Data (JSON)
            </Button>
            <Button variant="ghost" icon={<Upload size={14} />} onClick={() => setImportOpen(true)}>
              Import JSON
            </Button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Keyboard shortcuts: <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>N</kbd> new match &nbsp;
            <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>/</kbd> search focus &nbsp;
            <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>E</kbd> export
          </div>
        </>
      ))}

      {/* Danger zone */}
      {card('Danger Zone', (
        <>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            This will permanently delete all your career data from localStorage. Make sure to export first.
          </div>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleWipe} style={{ alignSelf: 'flex-start' }}>
            Wipe All Data
          </Button>
        </>
      ))}

      {/* Import Modal */}
      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportError(''); setImportText(''); }}
        title="Import Career JSON"
        width="700px"
        actions={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleImport}>Import (Overwrite)</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Paste the JSON exported earlier. This will overwrite current data.
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"career":{...},"matches":[...]}'
            style={{
              width: '100%', minHeight: '240px', padding: '10px 12px',
              borderRadius: '10px', border: '1px solid rgba(34,48,74,0.9)',
              background: 'rgba(5,9,16,0.5)', color: 'var(--text)',
              fontFamily: 'ui-monospace, monospace', fontSize: '12px',
              resize: 'vertical', outline: 'none',
            }}
          />
          {importError && (
            <div style={{ fontSize: '12px', color: 'var(--danger)', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              {importError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
