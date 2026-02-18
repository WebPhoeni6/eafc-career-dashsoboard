import React, { useRef, useState } from 'react';
import { useCareerStore } from '../../../store/career.store';
import { parseImport } from '../../../services/export/importJson';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Settings, Download, Upload, Trash2, Sun, Moon, FileJson } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { downloadCareerExport, importCareer } from '../../../services/api/sync.api';
import { hydrateActiveCareerModules, hydrateCareerModules } from '../../../services/api/hydrate';

function getImportSaveName(payload: Record<string, unknown>): string {
  const explicit = payload.saveName;
  if (typeof explicit === 'string' && explicit.trim()) return explicit;

  const career = payload.career;
  if (career && typeof career === 'object' && 'playerName' in career) {
    const playerName = (career as { playerName?: unknown }).playerName;
    if (typeof playerName === 'string' && playerName.trim()) return `${playerName.trim()} Save`;
  }
  return `Imported Save ${new Date().toISOString().slice(0, 10)}`;
}

export const SettingsPage: React.FC = () => {
  const { career, activeCareerId, theme, setTheme, backupMatchThreshold, setBackupThreshold } = useCareerStore();
  const toast = useToast((s) => s.show);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    if (!activeCareerId) {
      toast('No active career to export', 'error');
      return;
    }
    try {
      setBusy(true);
      await downloadCareerExport(activeCareerId, career?.playerName);
      toast('Exported JSON file', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = (file: File) => {
    setImportError('');
    setImportProgress(0);
    setSelectedFileName(file.name);
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 60);
      setImportProgress(percent);
    };

    reader.onload = () => {
      setImportText(String(reader.result || ''));
      setImportProgress(65);
    };

    reader.onerror = () => {
      setImportError('Failed to read file');
      setImportProgress(0);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImportError('');
    setImportProgress((prev) => Math.max(prev, 70));
    const result = parseImport(importText);
    if (!result.valid || !result.data) {
      setImportError(result.errors.join('\n'));
      setImportProgress(0);
      return;
    }

    try {
      setBusy(true);
      setImportProgress(82);
      const payload = result.data;
      const response = await importCareer({ ...payload, saveName: getImportSaveName(payload) });
      setImportProgress(92);
      await useCareerStore.getState().loadCareers();
      await useCareerStore.getState().activateCareer(response.careerId);
      await hydrateCareerModules(response.careerId);
      setImportProgress(100);
      setImportOpen(false);
      setImportError('');
      setImportText('');
      setSelectedFileName('');
      toast('Imported successfully', 'success');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
      setImportProgress(0);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteActiveCareer = async () => {
    if (!window.confirm('Delete active career and all linked records?')) return;
    try {
      setBusy(true);
      await useCareerStore.getState().clearCareer();
      await hydrateActiveCareerModules();
      toast('Active career deleted', 'default');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const card = (title: string, children: React.ReactNode) => (
    <div
      style={{
        background: 'var(--card-gradient)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 700 }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="Settings" subtitle="Export, import, theme, backup, and data management" icon={<Settings size={18} />} />

      {card(
        'Appearance',
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Current theme:</span>
          <Button variant={theme === 'dark' ? 'accent' : 'ghost'} size="sm" icon={<Moon size={13} />} onClick={() => setTheme('dark')}>
            Dark
          </Button>
          <Button variant={theme === 'light' ? 'accent' : 'ghost'} size="sm" icon={<Sun size={13} />} onClick={() => setTheme('light')}>
            Light
          </Button>
        </div>,
      )}

      {card(
        'Auto-Backup Reminder',
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
        </div>,
      )}

      {card(
        'Data Export / Import',
        <>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Export active career to a file or import progress from a JSON file.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="green" icon={<Download size={14} />} onClick={() => { void handleExport(); }} disabled={busy}>
              Export Active Career File
            </Button>
            <Button variant="ghost" icon={<Upload size={14} />} onClick={() => setImportOpen(true)} disabled={busy}>
              Import From File
            </Button>
          </div>
        </>,
      )}

      {card(
        'Danger Zone',
        <>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            This deletes the active career and all linked records in the backend.
          </div>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => { void handleDeleteActiveCareer(); }} style={{ alignSelf: 'flex-start' }} disabled={busy}>
            Delete Active Career
          </Button>
        </>,
      )}

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportError('');
          setImportText('');
          setSelectedFileName('');
          setImportProgress(0);
        }}
        title="Import Career File"
        width="700px"
        actions={
          <>
            <Button variant="ghost" onClick={() => setImportOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { void handleImport(); }} disabled={busy || !importText}>
              Import
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Select a JSON export file. A new save is created and activated automatically.
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />

          <Button variant="ghost" icon={<FileJson size={14} />} onClick={() => fileInputRef.current?.click()} disabled={busy}>
            Choose JSON File
          </Button>

          {selectedFileName && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Selected: <strong style={{ color: 'var(--text)' }}>{selectedFileName}</strong>
            </div>
          )}

          {importProgress > 0 && (
            <div style={{ display: 'grid', gap: '6px' }}>
              <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${importProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #14b8a6)',
                    transition: 'width 0.25s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{importProgress}%</span>
            </div>
          )}

          {importError && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--danger)',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {importError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
