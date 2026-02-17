import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import type { Match } from '../../../types/match.types';
import { fmtDate } from '../../../utils/date';
import { fmtRating, fmtDecimal, fmtPct, per90 } from '../../../utils/format';
import { resultLabel } from '../../../utils/format';

interface MatchDetailModalProps {
  match: Match | null;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(34,48,74,0.4)', fontSize: '13px' }}>
    <span style={{ color: 'var(--muted)' }}>{label}</span>
    <strong style={{ color: color ?? 'var(--text)' }}>{value}</strong>
  </div>
);

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match: m, onClose }) => {
  if (!m) return null;
  const res = resultLabel(m.scoreFor, m.scoreAgainst);
  const g90 = per90(m.goals, m.minutesPlayed);
  const a90 = per90(m.assists, m.minutesPlayed);
  const conv = m.shots ? ((m.goals / m.shots) * 100) : 0;

  return (
    <Modal open={!!m} onClose={onClose} title={`${m.opponent} — ${fmtDate(m.matchDate)}`} width="680px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--muted)' }}>MATCH INFO</div>
          <Row label="Date" value={fmtDate(m.matchDate)} />
          <Row label="Competition" value={`${m.competition}${m.stage !== 'N/A' ? ` — ${m.stage}` : ''}`} />
          <Row label="Opponent" value={m.opponent} />
          <Row label="Result" value={res.text} color={res.cls === 'win' ? '#22c55e' : res.cls === 'draw' ? '#f59e0b' : '#ef4444'} />
          <Row label="Position" value={m.posPlayed} />
          <Row label="Minutes" value={m.minutesPlayed} />
          <Row label="Rating" value={fmtRating(m.matchRating)} color="#f59e0b" />
          <Row label="Manager Trust" value={m.trust} />
          <Row label="Opp. Strength" value={'⭐'.repeat(m.opponentStrength)} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--muted)' }}>PERFORMANCE</div>
          <Row label="Goals" value={m.goals} color="#22c55e" />
          <Row label="Assists" value={m.assists} color="#7c5cff" />
          <Row label="Goals/90" value={fmtDecimal(g90)} />
          <Row label="Assists/90" value={fmtDecimal(a90)} />
          <Row label="Shots" value={m.shots} />
          <Row label="Shots on Target" value={m.shotsOnTarget} />
          <Row label="xG" value={fmtDecimal(m.xG)} />
          <Row label="Conversion" value={fmtPct(conv)} />
          <Row label="Key Passes" value={m.keyPasses} />
          <Row label="Chances Created" value={m.chancesCreated} />
          <Row label="Dribbles" value={`${m.dribblesCompleted}/${m.dribblesAttempted}`} />
          <Row label="Pass Accuracy" value={fmtPct(m.passAccuracy)} />
          <Row label="Cross Accuracy" value={fmtPct(m.crossAccuracy)} />
        </div>
      </div>
      {/* Flags */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
        {m.motm && <Tag label="MOTM" color="#f59e0b" />}
        {m.clutchMoment && <Tag label="Clutch Moment" color="#ef4444" />}
        {m.objectivesCompleted && <Tag label="Objectives ✓" color="#22c55e" />}
      </div>
      {/* OVR / SP */}
      {(m.ovrAfter !== '' || m.spAfter !== '') && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '13px' }}>
          {m.ovrAfter !== '' && <span style={{ color: 'var(--muted)' }}>OVR after: <strong style={{ color: '#7c5cff' }}>{m.ovrAfter}</strong></span>}
          {m.spAfter !== '' && <span style={{ color: 'var(--muted)' }}>SP after: <strong>{m.spAfter}</strong></span>}
        </div>
      )}
      {/* Notes */}
      {m.notes && (
        <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,48,74,0.5)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
          {m.notes}
        </div>
      )}
      {m.objectivesNotes && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)' }}>
          Objectives: {m.objectivesNotes}
        </div>
      )}
    </Modal>
  );
};

const Tag: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '12px', background: color + '22', border: `1px solid ${color}44`, color }}>
    {label}
  </span>
);
