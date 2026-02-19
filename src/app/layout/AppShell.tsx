import React, { useCallback, useEffect, useRef, useState } from 'react';
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
const MAX_ANALYSIS_IMAGES = 4;
const MAX_ANALYSIS_DIMENSION = 1600;
const MAX_UNCOMPRESSED_BYTES = 1_200_000;

function toMatchSortKey(m: Match): string {
  return `${m.matchDate || ''}#${m.createdAt || ''}`;
}

function buildCarryForwardPrefill(matches: Match[]): Partial<MatchDraft> {
  if (!matches.length) return {};
  const lastMatch = [...matches].sort((a, b) => toMatchSortKey(b).localeCompare(toMatchSortKey(a)))[0];
  return {
    competition: lastMatch.competition,
    stage: lastMatch.stage,
    posPlayed: lastMatch.posPlayed,
    minutesPlayed: lastMatch.minutesPlayed || 90,
    trust: lastMatch.trust,
    opponentStrength: lastMatch.opponentStrength,
  };
}

function fileSignature(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function analysisCacheKey(files: File[]): string {
  return files.map(fileSignature).sort().join('|');
}

async function compressImageForAnalysis(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= MAX_UNCOMPRESSED_BYTES || typeof createImageBitmap !== 'function') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_ANALYSIS_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    });
    if (!blob || blob.size >= file.size * 0.98) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

export const AppShell: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMatchOpen, setNewMatchOpen] = useState(false);
  const [newMatchTab, setNewMatchTab] = useState<'manual' | 'image'>('manual');
  const [analysisFiles, setAnalysisFiles] = useState<File[]>([]);
  const [processingImages, setProcessingImages] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{ before: number; after: number } | null>(null);
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
  const snapInputRef = useRef<HTMLInputElement | null>(null);
  const analysisCacheRef = useRef<Map<string, MatchAnalysisResult>>(new Map());

  const resetNewMatchState = () => {
    setNewMatchTab('manual');
    setAnalysisFiles([]);
    setProcessingImages(false);
    setCompressionStats(null);
    setAnalyzing(false);
    setAnalysisResult(null);
    setMatchPrefill(null);
  };

  const openNewMatchModal = () => {
    resetNewMatchState();
    setMatchPrefill(buildCarryForwardPrefill(matches));
    setPrefillVersion((n) => n + 1);
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
  }, [activeCareerId, career?.playerName, matches, toast]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const processSelectedFiles = useCallback(async (incoming: File[], append = false) => {
    const picked = incoming.filter((file) => file.type.startsWith('image/')).slice(0, MAX_ANALYSIS_IMAGES);
    if (!picked.length) {
      toast('No valid image found', 'error');
      return;
    }

    setProcessingImages(true);
    try {
      const processed = await Promise.all(picked.map((file) => compressImageForAnalysis(file)));
      const before = picked.reduce((sum, file) => sum + file.size, 0);
      const after = processed.reduce((sum, file) => sum + file.size, 0);
      setCompressionStats(before > after ? { before, after } : null);

      setAnalysisFiles((prev) => {
        const merged = append ? [...prev, ...processed] : processed;
        return merged.slice(0, MAX_ANALYSIS_IMAGES);
      });
      setAnalysisResult(null);
    } finally {
      setProcessingImages(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!newMatchOpen || newMatchTab !== 'image') return;

    const handler = (event: ClipboardEvent) => {
      const pastedImages = Array.from(event.clipboardData?.files || []).filter((file) =>
        file.type.startsWith('image/'));
      if (!pastedImages.length) return;
      event.preventDefault();
      void processSelectedFiles(pastedImages, true);
      toast(`${pastedImages.length} image pasted`, 'success');
    };

    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [newMatchOpen, newMatchTab, processSelectedFiles, toast]);

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      toast('Clipboard image paste is not supported in this browser', 'error');
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      const pasted: File[] = [];
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const extension = imageType.includes('png') ? 'png' : imageType.includes('webp') ? 'webp' : 'jpg';
        pasted.push(new File([blob], `clipboard-${Date.now()}-${pasted.length + 1}.${extension}`, { type: imageType }));
      }

      if (!pasted.length) {
        toast('No image found in clipboard', 'error');
        return;
      }

      await processSelectedFiles(pasted, true);
      toast(`${pasted.length} image pasted`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not read clipboard image', 'error');
    }
  };

  const handleAnalyze = async () => {
    if (!analysisFiles.length) {
      toast('Select at least one screenshot first', 'error');
      return;
    }

    const cacheKey = analysisCacheKey(analysisFiles);
    const cached = analysisCacheRef.current.get(cacheKey);
    if (cached) {
      setAnalysisResult(cached);
      setMatchPrefill(cached.suggested as Partial<MatchDraft>);
      setPrefillVersion((n) => n + 1);
      setNewMatchTab('manual');
      toast('Loaded cached analysis', 'default');
      return;
    }

    try {
      setAnalyzing(true);
      const result = await analyzePerformanceImages(analysisFiles);
      analysisCacheRef.current.set(cacheKey, result);
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
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    void processSelectedFiles(files, false);
  };

  const handleSnapFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    void processSelectedFiles(files, true);
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
                draftKey="matches.manual.draft.v1"
                onSubmit={handleAddMatch}
                onCancel={closeNewMatchModal}
              />
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                  Snap from camera, upload images, or paste from clipboard. The EAFC quick OCR pipeline extracts visible fields and prefills the manual form.
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                  Camera snap avoids creating extra screenshot files in your gallery.
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
                  <input
                    ref={snapInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleSnapFile}
                  />
                  <Button type="button" variant="green" size="sm" onClick={() => snapInputRef.current?.click()} disabled={processingImages}>
                    Snap Match Performance
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => analysisInputRef.current?.click()} disabled={processingImages}>
                    Choose Images
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { void handlePasteFromClipboard(); }} disabled={processingImages}>
                    Paste Screenshot
                  </Button>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Up to 4 images, JPG/PNG/WEBP, 5MB each. Ctrl+V also works in this tab.
                  </span>
                </div>

                {compressionStats && (
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Optimized upload size: {Math.round((compressionStats.before - compressionStats.after) / 1024)}KB saved
                  </div>
                )}

                {analysisFiles.length > 0 && (
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>Selected</div>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      {analysisFiles.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} style={{ fontSize: '12px' }}>
                          {idx + 1}. {file.name} ({Math.round(file.size / 1024)}KB)
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
                    {(analysisResult.pipeline || analysisResult.durationMs) && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Pipeline: <strong style={{ color: 'var(--text)' }}>{analysisResult.pipeline === 'EAFC_QUICK' ? 'EAFC Quick OCR' : 'Generic AI Vision'}</strong>
                        {typeof analysisResult.durationMs === 'number' ? ` • ${analysisResult.durationMs}ms` : ''}
                        {typeof analysisResult.imagesProcessed === 'number' ? ` • ${analysisResult.imagesProcessed} image(s)` : ''}
                      </div>
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
                  <Button type="button" variant="green" onClick={() => { void handleAnalyze(); }} disabled={processingImages || analyzing || analysisFiles.length === 0}>
                    {processingImages ? 'Preparing images...' : analyzing ? 'Analyzing...' : 'Analyze and Auto Fill'}
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
