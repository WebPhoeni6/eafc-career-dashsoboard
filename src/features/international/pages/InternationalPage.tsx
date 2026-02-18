import React from 'react';
import { useMatchesStore } from '../../../store/matches.store';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Globe2 } from 'lucide-react';
import { computeKPIs } from '../../../services/analytics/kpis';
import { fmtRating, fmtDecimal } from '../../../utils/format';
import { fmtDate } from '../../../utils/date';

export const InternationalPage: React.FC = () => {
  const matches = useMatchesStore((s) => s.matches);
  const intlMatches = matches.filter((m) => m.competition === 'International');
  const kpis = computeKPIs(intlMatches);

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'linear-gradient(180deg,rgba(16,24,42,0.92),rgba(15,23,41,0.92))', border: '1px solid rgba(34,48,74,0.75)', borderRadius: '16px', padding: '18px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="International Career" subtitle="Nigeria national team stats & tournament history" icon={<Globe2 size={18} />} />

      {/* Caps summary */}
      {card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>🦅 Super Eagles Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Caps', value: kpis.apps },
            { label: 'Goals', value: kpis.goals, color: '#22c55e' },
            { label: 'Assists', value: kpis.assists, color: '#7c5cff' },
            { label: 'Avg Rating', value: fmtRating(kpis.avgRating), color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,48,74,0.5)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{label}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: color ?? 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '10px' }}>
          {[
            { label: 'W/D/L', value: `${kpis.wins}/${kpis.draws}/${kpis.losses}` },
            { label: 'G/A per 90', value: fmtDecimal(kpis.gaPer90) },
            { label: 'MOTM', value: kpis.motmCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(34,48,74,0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{label}</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* International match log */}
      {card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>International Match Log</div>
        {intlMatches.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
            No international matches logged yet. Add a match with Competition = "International".
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead><tr style={{ color: 'var(--muted)' }}>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
              <th style={{ textAlign: 'left' }}>Opponent</th>
              <th>Stage</th><th>Result</th><th>G</th><th>A</th><th>Rating</th>
            </tr></thead>
            <tbody>
              {[...intlMatches].sort((a, b) => b.matchDate.localeCompare(a.matchDate)).map((m) => {
                const win = m.scoreFor > m.scoreAgainst;
                const draw = m.scoreFor === m.scoreAgainst;
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid rgba(34,48,74,0.4)' }}>
                    <td style={{ padding: '7px 8px', color: 'var(--muted)' }}>{fmtDate(m.matchDate)}</td>
                    <td style={{ fontWeight: 600 }}>{m.opponent}</td>
                    <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{m.stage}</td>
                    <td style={{ textAlign: 'center', color: win ? '#22c55e' : draw ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                      {m.scoreFor}–{m.scoreAgainst} {win ? 'W' : draw ? 'D' : 'L'}
                    </td>
                    <td style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{m.goals}</td>
                    <td style={{ textAlign: 'center', color: '#7c5cff', fontWeight: 700 }}>{m.assists}</td>
                    <td style={{ textAlign: 'center', color: '#f59e0b' }}>{fmtRating(m.matchRating)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </>)}
    </div>
  );
};

