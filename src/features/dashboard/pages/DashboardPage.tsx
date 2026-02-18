import React from 'react';
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
import { PageHeader } from '../../../components/shared/PageHeader';
import { LayoutDashboard, Star, Trophy } from 'lucide-react';
import { downloadCareerExport } from '../../../services/api/sync.api';
import { useToast } from '../../../hooks/useToast';
import { fmtRating } from '../../../utils/format';

export const DashboardPage: React.FC = () => {
  const { career, achievements, activeCareerId } = useCareerStore();
  const matches = useMatchesStore((s) => s.matches);
  const { trophies } = useSeasonsStore();
  const toast = useToast((s) => s.show);
  const context = useOutletContext<{ openNewMatch: () => void } | null>();

  const data = getDashboardData(matches, career);
  const { kpis, form, compSplits, posSplits, bigGamePerformer, milestones, charts } = data;

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
      {matches.length > 1 && card(<>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Manager Trust Trend</div>
        <LineChart series={charts.trust} height={140} yMin={0} yMax={4} />
      </>)}

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {card(<>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>By Competition</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ color: 'var(--muted)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Competition</th>
              <th>Apps</th><th>G</th><th>A</th><th>Avg ★</th>
            </tr></thead>
            <tbody>
              {compSplits.map((c) => (
                <tr key={c.competition} style={{ borderTop: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '6px 0' }}>{c.competition}</td>
                  <td style={{ textAlign: 'center' }}>{c.apps}</td>
                  <td style={{ textAlign: 'center', color: '#22c55e' }}>{c.goals}</td>
                  <td style={{ textAlign: 'center', color: '#7c5cff' }}>{c.assists}</td>
                  <td style={{ textAlign: 'center', color: '#f59e0b' }}>{fmtRating(c.avgRating)}</td>
                </tr>
              ))}
              {!compSplits.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', padding: '12px 0' }}>No matches yet</td></tr>}
            </tbody>
          </table>
        </>)}

        {card(<>
          <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>By Position</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ color: 'var(--muted)' }}>
              <th style={{ textAlign: 'left', padding: '4px 0' }}>Position</th>
              <th>Apps</th><th>G</th><th>A</th><th>Avg ★</th>
            </tr></thead>
            <tbody>
              {posSplits.map((p) => (
                <tr key={p.position} style={{ borderTop: '1px solid var(--border-muted)' }}>
                  <td style={{ padding: '6px 0' }}>{p.position}</td>
                  <td style={{ textAlign: 'center' }}>{p.apps}</td>
                  <td style={{ textAlign: 'center', color: '#22c55e' }}>{p.goals}</td>
                  <td style={{ textAlign: 'center', color: '#7c5cff' }}>{p.assists}</td>
                  <td style={{ textAlign: 'center', color: '#f59e0b' }}>{fmtRating(p.avgRating)}</td>
                </tr>
              ))}
              {!posSplits.length && <tr><td colSpan={5} style={{ color: 'var(--muted)', padding: '12px 0' }}>No matches yet</td></tr>}
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


