import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCareerStore } from '../../../store/career.store';
import { useMatchesStore } from '../../../store/matches.store';
import { useSeasonsStore } from '../../../store/seasons.store';
import { useTransfersStore } from '../../../store/transfers.store';
import { getDashboardData } from '../selectors';
import { KPIGrid } from '../components/KPIGrid';
import { FormMeter } from '../components/FormMeter';
import { QuickActions } from '../components/QuickActions';
import { LineChart } from '../../../components/charts/LineChart';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Copy, EyeOff, LayoutDashboard, Pencil, PlusCircle, Star, Trash2, Trophy } from 'lucide-react';
import { downloadCareerExport } from '../../../services/api/sync.api';
import {
  askCareerPerformanceQuestion,
  getCareerPerformanceInsights,
  type CareerPerformanceInsights,
  type CareerPerformanceQuestionResponse,
} from '../../../services/api/careers.api';
import { hydrateActiveCareerModules } from '../../../services/api/hydrate';
import { useToast } from '../../../hooks/useToast';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { fmtRating } from '../../../utils/format';
import { fmtDate, todayISO } from '../../../utils/date';
import { ApiError } from '../../../services/api/types';
import type { SeasonChallenge } from '../../../types/season.types';

type SortDirection = 'asc' | 'desc';
type CompSortKey = 'competition' | 'apps' | 'goals' | 'assists' | 'avgRating';
type PosSortKey = 'position' | 'apps' | 'goals' | 'assists' | 'avgRating';
type ChartRange = 'LAST_3M' | 'LAST_6M' | 'LAST_12M';

export const DashboardPage: React.FC = () => {
  const { career, achievements, activeCareerId, loadCareers } = useCareerStore();
  const matches = useMatchesStore((s) => s.matches);
  const trophies = useSeasonsStore((s) => s.trophies);
  const challenges = useSeasonsStore((s) => s.challenges);
  const addChallenge = useSeasonsStore((s) => s.addChallenge);
  const updateChallenge = useSeasonsStore((s) => s.updateChallenge);
  const deleteChallenge = useSeasonsStore((s) => s.deleteChallenge);
  const addNarrativeTag = useSeasonsStore((s) => s.addNarrativeTag);
  const addAgentNote = useTransfersStore((s) => s.addAgentNote);
  const toast = useToast((s) => s.show);
  const context = useOutletContext<{ openNewMatch: () => void } | null>();
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 760 : false,
  );
  const [chartRange, setChartRange] = useState<ChartRange>('LAST_6M');
  const [compSort, setCompSort] = useState<{ key: CompSortKey; direction: SortDirection }>({
    key: 'apps',
    direction: 'desc',
  });
  const [posSort, setPosSort] = useState<{ key: PosSortKey; direction: SortDirection }>({
    key: 'apps',
    direction: 'desc',
  });
  const [insightRecentWindow, setInsightRecentWindow] = useState<number>(8);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<CareerPerformanceInsights | null>(null);
  const [insightQuestion, setInsightQuestion] = useState('');
  const [insightQuestionLoading, setInsightQuestionLoading] = useState(false);
  const [insightFollowUps, setInsightFollowUps] = useState<CareerPerformanceQuestionResponse[]>([]);
  const [addingMilestoneLabel, setAddingMilestoneLabel] = useState<string | null>(null);
  const [suggestionActionKey, setSuggestionActionKey] = useState<string | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<SeasonChallenge | null>(null);
  const [challengeEditForm, setChallengeEditForm] = useState({
    label: '',
    target: 1,
    unit: 'goals',
  });
  const [hiddenCompletedMilestones, setHiddenCompletedMilestones] = useLocalStorage<string[]>(
    'dashboard.hidden.completed.milestones.v1',
    [],
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const chartRangeOptions = useMemo(
    () => [
      { value: 'LAST_3M', label: 'Last 3 months' },
      { value: 'LAST_6M', label: 'Last 6 months' },
      { value: 'LAST_12M', label: 'Last year' },
    ],
    [],
  );

  const chartMatches = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    if (chartRange === 'LAST_3M') cutoff.setMonth(cutoff.getMonth() - 3);
    if (chartRange === 'LAST_6M') cutoff.setMonth(cutoff.getMonth() - 6);
    if (chartRange === 'LAST_12M') cutoff.setFullYear(cutoff.getFullYear() - 1);

    const filtered = matches.filter((m) => {
      if (!m.matchDate) return false;
      const parsed = new Date(m.matchDate);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed >= cutoff && parsed <= now;
    });
    return filtered.length ? filtered : matches;
  }, [matches, chartRange]);

  const data = useMemo(() => getDashboardData(matches, career, chartMatches), [matches, career, chartMatches]);
  const { kpis, form, compSplits, posSplits, bigGamePerformer, milestones, charts } = data;
  const challengeLabels = new Set(challenges.map((c) => c.label.trim().toLowerCase()));

  const challengeProgressById = useMemo(() => {
    const clean = (value: string) => value.trim().toLowerCase().replace(/[_-]/g, ' ');
    const byId = new Map<string, { current: number; completed: boolean }>();

    for (const challenge of challenges) {
      const unit = clean(challenge.unit);
      let current = challenge.current;

      if (unit === 'goal' || unit === 'goals') current = kpis.goals;
      else if (unit === 'assist' || unit === 'assists') current = kpis.assists;
      else if (unit === 'appearance' || unit === 'appearances' || unit === 'app' || unit === 'apps' || unit === 'match' || unit === 'matches') current = kpis.apps;
      else if (unit === 'ga' || unit === 'g/a' || unit === 'goal contribution' || unit === 'goal contributions') current = kpis.ga;
      else if (unit === 'motm' || unit === 'man of the match') current = kpis.motmCount;
      else if (unit === 'hat trick' || unit === 'hat tricks' || unit === 'hat-trick' || unit === 'hat-tricks') current = kpis.hatTricks;
      else if (unit === 'clean sheet' || unit === 'clean sheets') current = matches.filter((m) => Number(m.scoreAgainst) === 0).length;
      else if (unit === 'average rating' || unit === 'avg rating' || unit === 'rating') current = Number(kpis.avgRating.toFixed(2));

      const roundedCurrent = Number(current.toFixed(2));
      byId.set(challenge.id, {
        current: roundedCurrent,
        completed: roundedCurrent >= challenge.target,
      });
    }
    return byId;
  }, [challenges, kpis, matches]);

  const milestoneCards = useMemo(() => {
    const systemMilestones = milestones.map((m) => ({
      key: m.key,
      label: m.label,
      target: m.target,
      current: m.current,
      unit: m.unit,
      reached: m.reached,
      source: 'system' as const,
      challengeId: null as string | null,
    }));

    const challengeMilestones = challenges.map((c) => {
      const synced = challengeProgressById.get(c.id);
      const current = synced?.current ?? c.current;
      const reached = synced?.completed ?? c.completed;
      return {
        key: `challenge:${c.id}`,
        label: c.label,
        target: c.target,
        current,
        unit: c.unit,
        reached,
        source: 'challenge' as const,
        challengeId: c.id,
      };
    });

    return [...systemMilestones, ...challengeMilestones];
  }, [milestones, challenges, challengeProgressById]);

  const visibleMilestones = useMemo(
    () => milestoneCards.filter((m) => !(m.reached && hiddenCompletedMilestones.includes(m.key))),
    [milestoneCards, hiddenCompletedMilestones],
  );

  const sortedCompSplits = useMemo(() => {
    const dir = compSort.direction === 'asc' ? 1 : -1;
    return [...compSplits].sort((a, b) => {
      if (compSort.key === 'competition') return a.competition.localeCompare(b.competition) * dir;
      return ((a[compSort.key] as number) - (b[compSort.key] as number)) * dir;
    });
  }, [compSplits, compSort]);

  const sortedPosSplits = useMemo(() => {
    const dir = posSort.direction === 'asc' ? 1 : -1;
    return [...posSplits].sort((a, b) => {
      if (posSort.key === 'position') return a.position.localeCompare(b.position) * dir;
      return ((a[posSort.key] as number) - (b[posSort.key] as number)) * dir;
    });
  }, [posSplits, posSort]);

  useEffect(() => {
    const pending = challenges
      .map((challenge) => {
        const next = challengeProgressById.get(challenge.id);
        if (!next) return null;
        const currentChanged = Math.abs(next.current - challenge.current) > 0.01;
        const completedChanged = next.completed !== challenge.completed;
        if (!currentChanged && !completedChanged) return null;
        return {
          id: challenge.id,
          current: next.current,
          completed: next.completed,
        };
      })
      .filter((item): item is { id: string; current: number; completed: boolean } => !!item);

    if (!pending.length) return;

    let cancelled = false;
    const sync = async () => {
      for (const item of pending) {
        if (cancelled) break;
        try {
          await updateChallenge(item.id, {
            current: item.current,
            completed: item.completed,
          });
        } catch {
          // silently skip auto-sync failures
        }
      }
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [challenges, challengeProgressById, updateChallenge]);

  const toggleCompSort = (key: CompSortKey) => {
    setCompSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'competition' ? 'asc' : 'desc' },
    );
  };

  const togglePosSort = (key: PosSortKey) => {
    setPosSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'position' ? 'asc' : 'desc' },
    );
  };

  const sortArrow = (active: boolean, direction: SortDirection) => (active ? (direction === 'asc' ? '^' : 'v') : '<>');

  const handleExport = async () => {
    if (!activeCareerId) {
      toast('No active career to export', 'error');
      return;
    }
    try {
      await downloadCareerExport(activeCareerId, career?.playerName);
      toast('Exported', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const handleGenerateInsights = async () => {
    if (!activeCareerId) {
      toast('No active career selected', 'error');
      return;
    }

    try {
      setInsightsLoading(true);
      const data = await getCareerPerformanceInsights(activeCareerId, insightRecentWindow);
      setInsights(data);
      setInsightFollowUps([]);
      toast('AI analysis ready', 'success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        if (err.message.toLowerCase().includes('route not found')) {
          toast('Insights route not found on backend. Restart backend server to load latest routes.', 'error');
        } else {
          try {
            await loadCareers();
            await hydrateActiveCareerModules();
            const nextCareerId = useCareerStore.getState().activeCareerId;
            if (nextCareerId) {
              const retried = await getCareerPerformanceInsights(nextCareerId, insightRecentWindow);
              setInsights(retried);
              toast('AI analysis ready', 'success');
              return;
            }
          } catch {
            // fall through to generic error below
          }
          toast('Active career not found. Pick a valid career from Careers page, then retry.', 'error');
        }
      } else {
        toast(err instanceof Error ? err.message : 'Failed to generate analysis', 'error');
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  const insightsToClipboardText = (data: CareerPerformanceInsights) => {
    const lines: string[] = [
      'AI Performance Insights',
      '',
      `Summary: ${data.summary}`,
      `Momentum: ${data.momentum}`,
      typeof data.confidence === 'number' ? `Confidence: ${Math.round(data.confidence * 100)}%` : 'Confidence: n/a',
      `Window: ${data.recentMatchesConsidered} matches`,
      `Generated: ${fmtDate(data.generatedAt)}`,
      '',
      `Strengths: ${data.strengths.join('; ') || 'None identified yet'}`,
      `Concerns: ${data.concerns.join('; ') || 'No major concerns flagged'}`,
      `Next Match: ${data.recommendations.nextMatch.join('; ') || 'No suggestions'}`,
      `Next Match Why: ${data.recommendationRationale?.nextMatch || 'n/a'}`,
      `Training: ${data.recommendations.training.join('; ') || 'No suggestions'}`,
      `Training Why: ${data.recommendationRationale?.training || 'n/a'}`,
      `Season Plan: ${data.recommendations.season.join('; ') || 'No suggestions'}`,
      `Season Plan Why: ${data.recommendationRationale?.season || 'n/a'}`,
      `Transfer Strategy: ${data.recommendations.transfers.join('; ') || 'No suggestions'}`,
      `Transfer Strategy Why: ${data.recommendationRationale?.transfers || 'n/a'}`,
      `Milestone Suggestions: ${(Array.isArray(data.milestoneSuggestions) ? data.milestoneSuggestions : []).map((s) => `${s.label} (${s.target} ${s.unit})${s.why ? ` - ${s.why}` : ''}`).join('; ') || 'No suggestions'}`,
      `Metrics To Watch: ${data.keyMetricsToWatch.join('; ') || 'No metrics suggested'}`,
    ];
    return lines.join('\n');
  };

  const copyText = async (text: string) => {
    if (!text.trim()) {
      toast('Nothing to copy yet', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied', 'success');
    } catch {
      toast('Copy failed', 'error');
    }
  };

  const handleAskInsightQuestion = async () => {
    const question = insightQuestion.trim();
    if (!question) {
      toast('Type a question first', 'error');
      return;
    }
    if (!activeCareerId) {
      toast('No active career selected', 'error');
      return;
    }

    try {
      setInsightQuestionLoading(true);
      const answer = await askCareerPerformanceQuestion(activeCareerId, question, insightRecentWindow);
      setInsightFollowUps((prev) => [answer, ...prev].slice(0, 6));
      setInsightQuestion('');
      toast('Answer ready', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to answer question', 'error');
    } finally {
      setInsightQuestionLoading(false);
    }
  };

  const handleAddAiMilestone = async (suggestion: { label: string; target: number; unit: string }) => {
    const normalizedLabel = suggestion.label.trim().toLowerCase();
    if (!career) {
      toast('Set up your career profile first', 'error');
      return;
    }
    if (challengeLabels.has(normalizedLabel)) {
      toast('Milestone already exists', 'default');
      return;
    }

    try {
      setAddingMilestoneLabel(suggestion.label);
      await addChallenge({
        season: career.season,
        label: suggestion.label.trim(),
        target: Math.max(1, Math.round(suggestion.target)),
        current: 0,
        unit: suggestion.unit.trim() || 'goals',
        completed: false,
      });
      toast('Milestone added', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add milestone', 'error');
    } finally {
      setAddingMilestoneLabel(null);
    }
  };

  const buildShareStatsText = () => {
    if (!career) return '';
    const lines = [
      `${career.playerName} - Career Stats`,
      `${career.club} | ${career.season}`,
      '',
      `Apps: ${kpis.apps}`,
      `Goals: ${kpis.goals}`,
      `Assists: ${kpis.assists}`,
      `G/A: ${kpis.ga}`,
      `Avg Rating: ${fmtRating(kpis.avgRating)}`,
      `Win Rate: ${Math.round(kpis.winRate)}%`,
      `MOTM: ${kpis.motmCount}`,
      `Hat-tricks: ${kpis.hatTricks}`,
      '',
      'Tracked with FC Career Tracker',
    ];
    return lines.join('\n');
  };

  const handleShareStats = async () => {
    const text = buildShareStatsText();
    if (!text) {
      toast('No career stats to share yet', 'error');
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: career ? `${career.playerName} Career Stats` : 'Career Stats',
          text,
        });
        toast('Shared', 'success');
        return;
      }
      await navigator.clipboard.writeText(text);
      toast('Share text copied', 'success');
    } catch {
      toast('Share failed', 'error');
    }
  };

  const handleCreateAgentNoteFromSuggestion = async (text: string, tag: 'Strategy' | 'Goal' = 'Strategy') => {
    const content = text.trim();
    if (!content) return;
    const actionKey = `note:${content}`;
    try {
      setSuggestionActionKey(actionKey);
      await addAgentNote({
        date: todayISO(),
        content,
        tag,
      });
      toast('Saved as agent note', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save agent note', 'error');
    } finally {
      setSuggestionActionKey(null);
    }
  };

  const handleCreateNarrativeTagFromSuggestion = async (text: string) => {
    if (!career) {
      toast('Set up your career profile first', 'error');
      return;
    }
    const clean = text.trim();
    if (!clean) return;
    const tag = clean.length > 80 ? `${clean.slice(0, 77)}...` : clean;
    const actionKey = `tag:${tag}`;
    try {
      setSuggestionActionKey(actionKey);
      await addNarrativeTag({
        season: career.season,
        tag,
      });
      toast('Saved as story tag', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save story tag', 'error');
    } finally {
      setSuggestionActionKey(null);
    }
  };

  const openChallengeEditor = (challengeId: string) => {
    const challenge = challenges.find((item) => item.id === challengeId);
    if (!challenge) return;
    setEditingChallenge(challenge);
    setChallengeEditForm({
      label: challenge.label,
      target: challenge.target,
      unit: challenge.unit,
    });
  };

  const saveChallengeEdit = async () => {
    if (!editingChallenge) return;
    const label = challengeEditForm.label.trim();
    const unit = challengeEditForm.unit.trim();
    const target = Number(challengeEditForm.target);
    if (!label) {
      toast('Milestone label is required', 'error');
      return;
    }
    if (!unit) {
      toast('Milestone unit is required', 'error');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      toast('Milestone target must be greater than 0', 'error');
      return;
    }

    try {
      await updateChallenge(editingChallenge.id, {
        label,
        unit,
        target: Math.round(target),
      });
      setEditingChallenge(null);
      toast('Milestone updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update milestone', 'error');
    }
  };

  const deleteChallengeMilestone = async (challengeId: string) => {
    try {
      await deleteChallenge(challengeId);
      toast('Milestone deleted', 'default');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete milestone', 'error');
    }
  };

  const hideCompletedMilestone = (key: string) => {
    setHiddenCompletedMilestones((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{
      background: 'var(--card-gradient)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '16px',
      ...style,
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader
        title="Dashboard"
        subtitle={career ? `${career.playerName} • ${career.club} • ${career.season}` : 'Set up your career profile to get started'}
        icon={<LayoutDashboard size={18} />}
        actions={
          <QuickActions
            onNewMatch={() => context?.openNewMatch()}
            onExport={() => { void handleExport(); }}
            onShare={() => { void handleShareStats(); }}
          />
        }
      />

      {/* Big game + achievement badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {bigGamePerformer && (
          <span style={{ padding: '5px 12px', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', fontSize: '12px', color: '#fbbf24' }}>
            👑 Big Game Performer
          </span>
        )}
        {achievements.filter((a) => a.unlockedAt).slice(0, 6).map((a) => (
          <span key={a.key} title={a.description} style={{ padding: '5px 12px', borderRadius: '999px', background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.3)', fontSize: '12px', color: 'var(--muted)' }}>
            {a.icon} {a.label}
          </span>
        ))}
      </div>

      {/* KPIs */}
      <KPIGrid kpis={kpis} ratingTrend={form.ratingTrend} />

      {/* AI insights */}
      {card(
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>AI Performance Insights</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Uses recent performances plus full career data for recommendations
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ width: '100%', maxWidth: '170px' }}>
                <Select
                  value={String(insightRecentWindow)}
                  onChange={(e) => setInsightRecentWindow(Number(e.target.value))}
                  options={[
                    { value: '5', label: 'Last 5 matches' },
                    { value: '8', label: 'Last 8 matches' },
                    { value: '12', label: 'Last 12 matches' },
                    { value: '16', label: 'Last 16 matches' },
                  ]}
                />
              </div>
              <Button type="button" variant="green" size="sm" onClick={() => { void handleGenerateInsights(); }} disabled={insightsLoading}>
                {insightsLoading ? 'Analyzing...' : insights ? 'Refresh Analysis' : 'Generate Analysis'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Copy size={12} />}
                onClick={() => { void copyText(insights ? insightsToClipboardText(insights) : ''); }}
                disabled={!insights}
              >
                Copy
              </Button>
            </div>
          </div>

          {!insights ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Generate analysis to see strengths, concerns, and actionable next steps.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{insights.summary}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Momentum: <strong style={{ color: 'var(--text)' }}>{insights.momentum}</strong>
                {typeof insights.confidence === 'number' ? ` • Confidence: ${Math.round(insights.confidence * 100)}%` : ''}
                {` • Window: ${insights.recentMatchesConsidered} matches`}
                {` • Generated: ${fmtDate(insights.generatedAt)}`}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Strengths</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                    {insights.strengths.map((item, idx) => <li key={`st-${idx}`}>{item}</li>)}
                    {insights.strengths.length === 0 && <li>None identified yet</li>}
                  </ul>
                </div>
                <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Concerns</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                    {insights.concerns.map((item, idx) => <li key={`co-${idx}`}>{item}</li>)}
                    {insights.concerns.length === 0 && <li>No major concerns flagged</li>}
                  </ul>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Next Match</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {insights.recommendations.nextMatch.map((item, idx) => (
                      <div key={`nm-${idx}`} style={{ border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '8px', display: 'grid', gap: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={suggestionActionKey === `note:${item}`}
                            onClick={() => {
                              void handleCreateAgentNoteFromSuggestion(item, 'Strategy');
                            }}
                          >
                            {suggestionActionKey === `note:${item}` ? 'Saving...' : 'Add Note'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {insights.recommendations.nextMatch.length === 0 && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No suggestions</div>}
                  </div>
                  {insights.recommendationRationale?.nextMatch && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                      Why: {insights.recommendationRationale.nextMatch}
                    </div>
                  )}
                </div>
                <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Training Focus</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {insights.recommendations.training.map((item, idx) => (
                      <div key={`tr-${idx}`} style={{ border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '8px', display: 'grid', gap: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item}</div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={suggestionActionKey === `note:${item}`}
                            onClick={() => {
                              void handleCreateAgentNoteFromSuggestion(item, 'Goal');
                            }}
                          >
                            {suggestionActionKey === `note:${item}` ? 'Saving...' : 'Add Note'}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={suggestionActionKey === `tag:${item.length > 80 ? `${item.slice(0, 77)}...` : item}`}
                            onClick={() => {
                              void handleCreateNarrativeTagFromSuggestion(item);
                            }}
                          >
                            {suggestionActionKey === `tag:${item.length > 80 ? `${item.slice(0, 77)}...` : item}` ? 'Saving...' : 'Add Tag'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {insights.recommendations.training.length === 0 && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No suggestions</div>}
                  </div>
                  {insights.recommendationRationale?.training && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                      Why: {insights.recommendationRationale.training}
                    </div>
                  )}
                </div>
              </div>

              {(insights.recommendations.season.length > 0 || insights.recommendations.transfers.length > 0 || insights.keyMetricsToWatch.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Season Plan</div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {insights.recommendations.season.map((item, idx) => (
                        <div key={`se-${idx}`} style={{ border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '8px', display: 'grid', gap: '6px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item}</div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={suggestionActionKey === `note:${item}`}
                              onClick={() => {
                                void handleCreateAgentNoteFromSuggestion(item, 'Goal');
                              }}
                            >
                              {suggestionActionKey === `note:${item}` ? 'Saving...' : 'Add Note'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {insights.recommendations.season.length === 0 && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No suggestions</div>}
                    </div>
                    {insights.recommendationRationale?.season && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                        Why: {insights.recommendationRationale.season}
                      </div>
                    )}
                  </div>
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Transfer Strategy</div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {insights.recommendations.transfers.map((item, idx) => (
                        <div key={`tf-${idx}`} style={{ border: '1px solid var(--border-muted)', borderRadius: '8px', padding: '8px', display: 'grid', gap: '6px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item}</div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={suggestionActionKey === `note:${item}`}
                              onClick={() => {
                                void handleCreateAgentNoteFromSuggestion(item, 'Strategy');
                              }}
                            >
                              {suggestionActionKey === `note:${item}` ? 'Saving...' : 'Add Note'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {insights.recommendations.transfers.length === 0 && <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No suggestions</div>}
                    </div>
                    {insights.recommendationRationale?.transfers && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                        Why: {insights.recommendationRationale.transfers}
                      </div>
                    )}
                  </div>
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Metrics To Watch</div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                      {insights.keyMetricsToWatch.map((item, idx) => <li key={`km-${idx}`}>{item}</li>)}
                      {insights.keyMetricsToWatch.length === 0 && <li>No metrics suggested</li>}
                    </ul>
                  </div>
                </div>
              )}

              {(Array.isArray(insights.milestoneSuggestions) ? insights.milestoneSuggestions.length : 0) > 0 && (
                <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px', display: 'grid', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>AI Milestone Suggestions</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {(Array.isArray(insights.milestoneSuggestions) ? insights.milestoneSuggestions : []).map((s, idx) => {
                      const exists = challengeLabels.has(s.label.trim().toLowerCase());
                      const adding = addingMilestoneLabel === s.label;
                      const milestoneNote = `${s.label}: target ${s.target} ${s.unit}`;
                      return (
                        <div key={`${s.label}-${idx}`} style={{ border: '1px solid var(--border-muted)', borderRadius: '10px', padding: '9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                            <div>
                              <strong style={{ color: 'var(--text)' }}>{s.label}</strong> - Target {s.target} {s.unit}
                            </div>
                            {s.why && (
                              <div style={{ fontSize: '11px' }}>
                                Why: {s.why}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon={<PlusCircle size={12} />}
                              disabled={exists || adding}
                              onClick={() => {
                                void handleAddAiMilestone(s);
                              }}
                            >
                              {exists ? 'Added' : adding ? 'Adding...' : 'Set as Milestone'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={suggestionActionKey === `note:${milestoneNote}`}
                              onClick={() => {
                                void handleCreateAgentNoteFromSuggestion(milestoneNote, 'Goal');
                              }}
                            >
                              {suggestionActionKey === `note:${milestoneNote}` ? 'Saving...' : 'Add Note'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px', display: 'grid', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Ask Follow-up</div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <Input
                    value={insightQuestion}
                    onChange={(e) => setInsightQuestion(e.target.value)}
                    placeholder="Ask about your form, role fit, training focus, or transfer timing..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAskInsightQuestion();
                      }
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="button" variant="accent" size="sm" onClick={() => { void handleAskInsightQuestion(); }} disabled={insightQuestionLoading}>
                      {insightQuestionLoading ? 'Asking...' : 'Ask'}
                    </Button>
                  </div>
                </div>

                {insightFollowUps.length > 0 && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {insightFollowUps.map((item, idx) => (
                      <div key={`${item.generatedAt}-${idx}`} style={{ border: '1px solid var(--border-muted)', borderRadius: '10px', padding: '9px', display: 'grid', gap: '6px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Q: {item.question}
                        </div>
                        <div style={{ fontSize: '12px', lineHeight: 1.55 }}>{item.answer}</div>
                        {item.why && (
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Why: {item.why}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {typeof item.confidence === 'number' ? `Confidence ${Math.round(item.confidence * 100)}%` : 'Confidence n/a'}
                            {` • ${fmtDate(item.generatedAt)}`}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<Copy size={12} />}
                            onClick={() => { void copyText(`Q: ${item.question}\n\nA: ${item.answer}${item.why ? `\n\nWhy: ${item.why}` : ''}`); }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>,
      )}

      {/* Form */}
      <FormMeter form={form} />

      {/* Charts row */}
      {card(
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '230px' }}>
              <Select
                label="Chart Window"
                value={chartRange}
                onChange={(e) => setChartRange(e.target.value as ChartRange)}
                options={chartRangeOptions}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
            {card(<>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>OVR Over Time</div>
              <LineChart series={charts.ovr} height={isMobile ? 200 : 180} yMin={40} yMax={99} />
            </>)}
            {card(<>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Goals & Assists Per Match</div>
              <LineChart series={charts.goalsAssists} height={isMobile ? 200 : 180} yMin={0} />
            </>)}
            {card(<>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Rating Trend</div>
              <LineChart series={charts.rating} height={isMobile ? 200 : 180} yMin={0} yMax={10} />
            </>)}
            {card(<>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>G/A per 90 (Rolling)</div>
              <LineChart series={charts.gaPer90} height={isMobile ? 200 : 180} />
            </>)}
          </div>
        </div>,
      )}

      {/* Manager trust trend */}
      {chartMatches.length > 1 && card(<>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Manager Trust Trend</div>
        <LineChart series={charts.trust} height={140} yMin={0} yMax={4} />
      </>)}


      {/* Milestones */}
      {card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={16} style={{ color: 'var(--warning)' }} /> Milestones
          </span>
          {hiddenCompletedMilestones.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              icon={<Trash2 size={12} />}
              onClick={() => setHiddenCompletedMilestones([])}
            >
              Show Hidden ({hiddenCompletedMilestones.length})
            </Button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {visibleMilestones.map((m) => {
            const pct = Math.min(100, (m.current / m.target) * 100);
            return (
              <div key={m.key} style={{ padding: '12px', borderRadius: '12px', background: m.reached ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.reached ? 'rgba(34,197,94,0.3)' : 'rgba(34,48,74,0.6)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                    {m.label}
                    {m.source === 'challenge' && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--muted)' }}>custom</span>
                    )}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {m.reached && <span style={{ fontSize: '12px' }}>✅</span>}
                    {m.source === 'challenge' && m.challengeId && (
                      <>
                        <button
                          type="button"
                          onClick={() => openChallengeEditor(m.challengeId)}
                          title="Edit custom milestone"
                          style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { void deleteChallengeMilestone(m.challengeId); }}
                          title="Delete custom milestone"
                          style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                    {m.reached && (
                      <button
                        type="button"
                        onClick={() => hideCompletedMilestone(m.key)}
                        title="Hide completed milestone"
                        style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                      >
                        <EyeOff size={12} />
                      </button>
                    )}
                  </span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: m.reached ? '#22c55e' : '#7c5cff', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{m.current} / {m.target} {m.unit}</div>
              </div>
            );
          })}
          {visibleMilestones.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              No milestones visible.
            </div>
          )}
        </div>
      </>)}

      {/* Per-competition & per-position splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>By Competition</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '140px' }}>
                <Select
                  value={compSort.key}
                  onChange={(e) => toggleCompSort(e.target.value as CompSortKey)}
                  options={[
                    { value: 'competition', label: 'Competition' },
                    { value: 'apps', label: 'Apps' },
                    { value: 'goals', label: 'Goals' },
                    { value: 'assists', label: 'Assists' },
                    { value: 'avgRating', label: 'Avg Rating' },
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => setCompSort((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                style={{
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-muted)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {compSort.direction.toUpperCase()} {sortArrow(true, compSort.direction)}
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ color: 'var(--muted)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Competition</th>
              <th>Apps</th><th>G</th><th>A</th><th>Avg ★</th>
            </tr></thead>
            <tbody>
              {sortedCompSplits.map((c) => (
                <tr key={c.competition} style={{ borderTop: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '6px 0' }}>{c.competition}</td>
                  <td style={{ textAlign: 'center' }}>{c.apps}</td>
                  <td style={{ textAlign: 'center', color: '#22c55e' }}>{c.goals}</td>
                  <td style={{ textAlign: 'center', color: '#7c5cff' }}>{c.assists}</td>
                  <td style={{ textAlign: 'center', color: '#f59e0b' }}>{fmtRating(c.avgRating)}</td>
                </tr>
              ))}
              {!sortedCompSplits.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', padding: '12px 0' }}>No matches yet</td></tr>}
            </tbody>
          </table>
        </>)}

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>By Position</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '140px' }}>
                <Select
                  value={posSort.key}
                  onChange={(e) => togglePosSort(e.target.value as PosSortKey)}
                  options={[
                    { value: 'position', label: 'Position' },
                    { value: 'apps', label: 'Apps' },
                    { value: 'goals', label: 'Goals' },
                    { value: 'assists', label: 'Assists' },
                    { value: 'avgRating', label: 'Avg Rating' },
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => setPosSort((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                style={{
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-muted)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {posSort.direction.toUpperCase()} {sortArrow(true, posSort.direction)}
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ color: 'var(--muted)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Position</th>
              <th>Apps</th><th>G</th><th>A</th><th>Avg ★</th>
            </tr></thead>
            <tbody>
              {sortedPosSplits.map((p) => (
                <tr key={p.position} style={{ borderTop: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '6px 0' }}>{p.position}</td>
                  <td style={{ textAlign: 'center' }}>{p.apps}</td>
                  <td style={{ textAlign: 'center', color: '#22c55e' }}>{p.goals}</td>
                  <td style={{ textAlign: 'center', color: '#7c5cff' }}>{p.assists}</td>
                  <td style={{ textAlign: 'center', color: '#f59e0b' }}>{fmtRating(p.avgRating)}</td>
                </tr>
              ))}
              {!sortedPosSplits.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', padding: '12px 0' }}>No matches yet</td></tr>}
            </tbody>
          </table>
        </>)}
      </div>

      {/* Trophies */}
      {trophies.length > 0 && card(<>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star size={14} style={{ color: '#f59e0b' }} /> Trophies ({trophies.length})
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {trophies.map((t) => (
            <span key={t.id} style={{ padding: '5px 12px', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '12px' }}>
              🏆 {t.name} ({t.season})
            </span>
          ))}
        </div>
      </>)}

      <Modal
        open={!!editingChallenge}
        onClose={() => setEditingChallenge(null)}
        title="Edit Milestone"
        width="460px"
        actions={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditingChallenge(null)}>
              Cancel
            </Button>
            <Button type="button" variant="green" onClick={() => { void saveChallengeEdit(); }}>
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: '10px' }}>
          <Input
            label="Label"
            value={challengeEditForm.label}
            onChange={(e) => setChallengeEditForm((prev) => ({ ...prev, label: e.target.value }))}
          />
          <Input
            label="Target"
            type="number"
            min={1}
            value={challengeEditForm.target}
            onChange={(e) => setChallengeEditForm((prev) => ({ ...prev, target: Number(e.target.value) || 1 }))}
          />
          <Input
            label="Unit"
            value={challengeEditForm.unit}
            onChange={(e) => setChallengeEditForm((prev) => ({ ...prev, unit: e.target.value }))}
            placeholder="goals, assists, apps, clean sheets..."
          />
        </div>
      </Modal>
    </div>
  );
};



