import React from 'react';
import type { KPIs } from '../../../services/analytics/kpis';
import { fmtDecimal, fmtRating, fmtPct } from '../../../utils/format';
import { StatSparkline } from '../../../components/charts/StatSparkline';

interface KPICardProps {
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
  sparkline?: number[];
}

const KPICard: React.FC<KPICardProps> = ({ label, value, hint, color, sparkline }) => (
  <div style={{
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid rgba(34,48,74,0.75)',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }}>
    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: color ?? 'var(--text)' }}>{value}</div>
      {sparkline && sparkline.length > 1 && <StatSparkline data={sparkline} color={color ?? '#7c5cff'} />}
    </div>
    {hint && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{hint}</div>}
  </div>
);

interface KPIGridProps {
  kpis: KPIs;
  ratingTrend?: number[];
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, ratingTrend }) => {
  const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' } as const;
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={grid4}>
        <KPICard label="Appearances" value={kpis.apps} hint="All competitions" />
        <KPICard label="Goals" value={kpis.goals} hint="Total" color="#22c55e" />
        <KPICard label="Assists" value={kpis.assists} hint="Total" color="#7c5cff" />
        <KPICard label="Avg Rating" value={fmtRating(kpis.avgRating)} hint="Across matches" color="#f59e0b" sparkline={ratingTrend} />
      </div>
      <div style={grid4}>
        <KPICard label="G/A Contributions" value={kpis.ga} hint="Goals + assists" color="#22c55e" />
        <KPICard label="G/A per 90" value={fmtDecimal(kpis.gaPer90)} hint="Efficiency" />
        <KPICard label="Best Rating" value={fmtRating(kpis.bestRating)} hint="Peak match" color="#f59e0b" />
        <KPICard label="Latest OVR" value={kpis.latestOvr} hint="Profile / last match" color="#7c5cff" />
      </div>
      <div style={grid4}>
        <KPICard label="Minutes" value={kpis.totalMinutes.toLocaleString()} hint="Total played" />
        <KPICard label="Goals/90" value={fmtDecimal(kpis.goalsPer90)} hint="Per 90 min" color="#22c55e" />
        <KPICard label="Assists/90" value={fmtDecimal(kpis.assistsPer90)} hint="Per 90 min" color="#7c5cff" />
        <KPICard label="xG Total" value={fmtDecimal(kpis.xGTotal)} hint="Expected goals" />
      </div>
      <div style={grid3}>
        <KPICard label="Win Rate" value={fmtPct(kpis.winRate)} hint={`${kpis.wins}W ${kpis.draws}D ${kpis.losses}L`} color="#22c55e" />
        <KPICard label="MOTM Awards" value={kpis.motmCount} hint="Man of the match" color="#f59e0b" />
        <KPICard label="Clutch Moments" value={kpis.clutchCount} hint="Late winners etc." color="#7c5cff" />
      </div>
    </div>
  );
};
