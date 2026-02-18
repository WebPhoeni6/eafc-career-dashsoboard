import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
import { Modal } from '../../components/ui/Modal';
import { MatchForm } from '../../components/forms/MatchForm/MatchForm';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { useMatchesStore } from '../../store/matches.store';
import { useCareerStore } from '../../store/career.store';
import { useToast } from '../../hooks/useToast';
import { downloadCareerExport } from '../../services/api/sync.api';
import type { MatchAnalysisResult } from '../../services/api/matches.api';
import type { Match } from '../../types/match.types';

type MatchDraft = Omit<Match, 'id' | 'createdAt' | 'updatedAt'>;

export const AppShell: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMatchOpen, setNewMatchOpen] = useState(false);
  const [newMatchTab, setNewMatchTab] = useState<'manual' | 'image'>('manual');
  const [analysisFiles, setAnalysisFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MatchAnalysisResult | null>(null);
  const [matchPrefill, setMatchPrefill] = useState<Partial<MatchDraft> | null>(null);
  const [prefillVersion, setPrefillVersion] = useState(0);

  const addMatch = useMatchesStore((s) => s.addMatch);
  const uploadPerformanceImage = useMatchesStore((s) => s.uploadPerformanceImage);
  const analyzePerformanceImages = useMatchesStore((s) => s.analyzePerformanceImages);
  const matches = useMatchesStore((s) => s.matches);
  const { career, activeCareerId, checkAchievements, backupMatchThreshold, lastBackupMatchCount, setLastBackupCount } = useCareerStore();
  const toast = useToast((s) => s.show);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const analysisInputRef = useRef<HTMLInputElement | null>(null);

  const resetNewMatchState = () => {
    setNewMatchTab('manual');
    setAnalysisFiles([]);
    setAnalyzing(false);
    setAnalysisResult(null);
    setMatchPrefill(null);
  };

  const openNewMatchModal = () => {
    resetNewMatchState();
    setNewMatchOpen(true);
  };

  const closeNewMatchModal = () => {
    setNewMatchOpen(false);
    resetNewMatchState();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'n' || e.key === 'N') {
        openNewMatchModal();
        return;
      }

      if (e.key === 'e' || e.key === 'E') {
        if (!activeCareerId) {
          toast('No active career to export', 'error');
          return;
        }
        void (async () => {
          try {
            await downloadCareerExport(activeCareerId, career?.playerName);
            toast('Exported JSON', 'success');
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Export failed', 'error');
          }
        })();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchEl = document.getElementById('match-search') as HTMLInputElement | null;
        searchEl?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeCareerId, career?.playerName, toast]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleAnalyze = async () => {
    if (!analysisFiles.length) {
      toast('Select at least one screenshot first', 'error');
      return;
    }

    try {
      setAnalyzing(true);
      const result = await analyzePerformanceImages(analysisFiles);
      setAnalysisResult(result);
      setMatchPrefill(result.suggested as Partial<MatchDraft>);
      setPrefillVersion((n) => n + 1);
      setNewMatchTab('manual');
      toast('Details extracted. Review and save.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Image analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddMatch = async (m: Parameters<typeof addMatch>[0]) => {
    if (!career || !activeCareerId) {
      toast('Set your career profile first', 'error');
      return;
    }

    let newMatch: Awaited<ReturnType<typeof addMatch>>;
    try {
      newMatch = await addMatch(m);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add match', 'error');
      return;
    }

    let imageUploadFailed = false;
    const primaryImage = analysisFiles[0];
    if (primaryImage) {
      try {
        await uploadPerformanceImage(newMatch.id, primaryImage);
      } catch (_) {
        imageUploadFailed = true;
      }
    }

    closeNewMatchModal();
    toast(imageUploadFailed ? 'Match saved, but image upload failed' : 'Match added', imageUploadFailed ? 'error' : 'success');

    if (m.ovrAfter !== '') useCareerStore.setState((s) => ({ career: s.career ? { ...s.career, ovr: Number(m.ovrAfter) } : null }));
    if (m.spAfter !== '') useCareerStore.setState((s) => ({ career: s.career ? { ...s.career, spAvailable: Number(m.spAfter) } : null }));

    const allMatches = [...matches, newMatch];
    const totalGoals = allMatches.reduce((sum, x) => sum + (x.goals ?? 0), 0);
    const newKeys = await checkAchievements({
      totalGoals,
      totalMatches: allMatches.length,
      totalMotm: allMatches.filter((x) => x.motm).length,
      totalClutch: allMatches.filter((x) => x.clutchMoment).length,
      hatTricks: allMatches.filter((x) => x.goals >= 3).length,
      hasRating10: allMatches.some((x) => x.matchRating >= 10),
      hasScoredUCLKO: allMatches.some(
        (x) =>
          x.goals > 0 &&
          (x.competition === 'UCL' || x.competition === 'UEL') &&
          x.stage !== 'N/A' &&
          x.stage !== 'Group',
      ),
      gaStreak: 0,
      maxDribblesInMatch: Math.max(...allMatches.map((x) => x.dribblesCompleted ?? 0), 0),
    });

    if (newKeys.length) {
      const def = useCareerStore.getState().achievements.find((a) => a.key === newKeys[0]);
      if (def) toast(`Achievement unlocked: ${def.label}`, 'achievement', 3500);
    }

    const count = allMatches.length;
    if (count - lastBackupMatchCount >= backupMatchThreshold) {
      toast(`${count} matches logged - consider exporting a backup`, 'default', 4000);
      setLastBackupCount(count);
    }
  };

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    setAnalysisFiles(files);
    setAnalysisResult(null);
    event.target.value = '';
  };

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell__content">
        <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="app-main">
          <Outlet context={{ openNewMatch: openNewMatchModal, searchRef }} />
        </main>
        <Footer />
      </div>

      <Modal open={newMatchOpen} onClose={closeNewMatchModal} title="Add Match" width="960px">
        <Tabs
          tabs={[
            { id: 'manual', label: 'Manual Entry' },
            { id: 'image', label: 'Upload & Auto Fill' },
          ]}
          activeTab={newMatchTab}
          onChange={(tabId) => setNewMatchTab(tabId === 'image' ? 'image' : 'manual')}
        >
          {(activeTab) =>
            activeTab === 'manual' ? (
              <MatchForm
                prefill={matchPrefill}
                prefillVersion={prefillVersion}
                onSubmit={(values) => {
                  void handleAddMatch(values);
                }}
                onCancel={closeNewMatchModal}
              />
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                  Upload one or more match screenshots. The AI will extract visible fields and prefill the manual form.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    ref={analysisInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleSelectFiles}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => analysisInputRef.current?.click()}>
                    Choose Images
                  </Button>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Up to 4 images, JPG/PNG/WEBP, 5MB each
                  </span>
                </div>

                {analysisFiles.length > 0 && (
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Selected</div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      {analysisFiles.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} style={{ fontSize: '12px' }}>
                          {idx + 1}. {file.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult && (
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px', display: 'grid', gap: '8px' }}>
                    {typeof analysisResult.confidence === 'number' && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Confidence: <strong style={{ color: 'var(--text)' }}>{Math.round(analysisResult.confidence * 100)}%</strong>
                      </div>
                    )}
                    {analysisResult.summary && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{analysisResult.summary}</div>
                    )}
                    {analysisResult.missingFields.length > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Missing fields: {analysisResult.missingFields.join(', ')}
                      </div>
                    )}
                    {analysisResult.warnings.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                        Warnings: {analysisResult.warnings.join(' | ')}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <Button type="button" variant="ghost" onClick={() => setNewMatchTab('manual')}>
                    Back to Manual Form
                  </Button>
                  <Button type="button" variant="green" onClick={() => { void handleAnalyze(); }} disabled={analyzing || analysisFiles.length === 0}>
                    {analyzing ? 'Analyzing...' : 'Analyze and Auto Fill'}
                  </Button>
                </div>
              </div>
            )
          }
        </Tabs>
      </Modal>
    </div>
  );
};
