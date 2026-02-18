import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCareerStore } from '../../../store/career.store';
import { useMatchesStore } from '../../../store/matches.store';
import { useSeasonsStore } from '../../../store/seasons.store';
import { getDashboardData } from '../selectors';
import { KPIGrid } from '../components/KPIGrid';
import { FormMeter } from '../components/FormMeter';
import { QuickActions } from '../components/QuickActions';
import { LineChart } from '../../../components/charts/LineChart';
import { BarChart } from '../../../components/charts/BarChart';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { PageHeader } from '../../../components/shared/PageHeader';
import { LayoutDashboard, Star, Trophy } from 'lucide-react';
import { downloadCareerExport } from '../../../services/api/sync.api';
import { getCareerPerformanceInsights, type CareerPerformanceInsights } from '../../../services/api/careers.api';
import { hydrateActiveCareerModules } from '../../../services/api/hydrate';
import { useToast } from '../../../hooks/useToast';
import { fmtRating } from '../../../utils/format';
import { fmtDate, fmtMonth } from '../../../utils/date';
import { ApiError } from '../../../services/api/types';

type SortDirection = 'asc' | 'desc';
type CompSortKey = 'competition' | 'apps' | 'goals' | 'assists' | 'avgRating';
type PosSortKey = 'position' | 'apps' | 'goals' | 'assists' | 'avgRating';

export const DashboardPage: React.FC = () => {
  const { career, achievements, activeCareerId, loadCareers } = useCareerStore();
  const matches = useMatchesStore((s) => s.matches);
  const { trophies } = useSeasonsStore();
  const toast = useToast((s) => s.show);
  const context = useOutletContext<{ openNewMatch: () => void } | null>();
  const [chartMonth, setChartMonth] = useState<string>('ALL');
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

  const chartMonthOptions = useMemo(() => {
    const months = Array.from(
      new Set(
        matches
          .map((m) => (typeof m.matchDate === 'string' ? m.matchDate.slice(0, 7) : ''))
          .filter((ym) => /^\d{4}-\d{2}$/.test(ym)),
      ),
    ).sort((a, b) => b.localeCompare(a));

    return [
      { value: 'ALL', label: 'All months' },
      ...months.map((ym) => ({ value: ym, label: fmtMonth(ym) })),
    ];
  }, [matches]);

  const chartMatches = useMemo(() => {
    if (chartMonth === 'ALL') return matches;
    return matches.filter((m) => typeof m.matchDate === 'string' && m.matchDate.startsWith(chartMonth));
  }, [matches, chartMonth]);

  const data = getDashboardData(matches, career, chartMatches);
  const { kpis, form, compSplits, posSplits, bigGamePerformer, milestones, charts } = data;

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

  const sortArrow = (active: boolean, direction: SortDirection) => (active ? (direction === 'asc' ? '↑' : '↓') : '↕');

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
        actions={<QuickActions onNewMatch={() => context?.openNewMatch()} onExport={() => { void handleExport(); }} />}
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

      {/* Form */}
      <FormMeter form={form} />

      {/* Charts row */}
      {card(
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '230px' }}>
            <Select
              label="Chart Month"
              value={chartMonth}
              onChange={(e) => setChartMonth(e.target.value)}
              options={chartMonthOptions}
            />
          </div>
        </div>,
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {card(<>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>OVR Over Time</div>
          <LineChart series={charts.ovr} height={180} yMin={40} yMax={99} />
        </>)}
        {card(<>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Goals & Assists Per Match</div>
          <BarChart series={charts.goalsAssists} height={180} />
        </>)}
        {card(<>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Rating Trend</div>
          <LineChart series={charts.rating} height={180} yMin={0} yMax={10} />
        </>)}
        {card(<>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>G/A per 90 (Rolling)</div>
          <LineChart series={charts.gaPer90} height={180} />
        </>)}
      </div>

      {/* Manager trust trend */}
      {chartMatches.length > 1 && card(<>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Manager Trust Trend</div>
        <LineChart series={charts.trust} height={140} yMin={0} yMax={4} />
      </>)}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                    {insights.recommendations.nextMatch.map((item, idx) => <li key={`nm-${idx}`}>{item}</li>)}
                    {insights.recommendations.nextMatch.length === 0 && <li>No suggestions</li>}
                  </ul>
                </div>
                <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Training Focus</div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                    {insights.recommendations.training.map((item, idx) => <li key={`tr-${idx}`}>{item}</li>)}
                    {insights.recommendations.training.length === 0 && <li>No suggestions</li>}
                  </ul>
                </div>
              </div>

              {(insights.recommendations.season.length > 0 || insights.recommendations.transfers.length > 0 || insights.keyMetricsToWatch.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Season Plan</div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                      {insights.recommendations.season.map((item, idx) => <li key={`se-${idx}`}>{item}</li>)}
                      {insights.recommendations.season.length === 0 && <li>No suggestions</li>}
                    </ul>
                  </div>
                  <div style={{ border: '1px solid var(--border-muted)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Transfer Strategy</div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--muted)', display: 'grid', gap: '4px' }}>
                      {insights.recommendations.transfers.map((item, idx) => <li key={`tf-${idx}`}>{item}</li>)}
                      {insights.recommendations.transfers.length === 0 && <li>No suggestions</li>}
                    </ul>
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
            </div>
          )}
        </div>,
      )}

      {/* Milestones */}
      {card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} style={{ color: 'var(--warning)' }} /> Milestones
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {milestones.map((m) => {
            const pct = Math.min(100, (m.current / m.target) * 100);
            return (
              <div key={m.key} style={{ padding: '12px', borderRadius: '12px', background: m.reached ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.reached ? 'rgba(34,197,94,0.3)' : 'rgba(34,48,74,0.6)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.label}</span>
                  {m.reached && <span style={{ fontSize: '12px' }}>✅</span>}
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: m.reached ? '#22c55e' : '#7c5cff', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{m.current} / {m.target} {m.unit}</div>
              </div>
            );
          })}
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
    </div>
  );
};



