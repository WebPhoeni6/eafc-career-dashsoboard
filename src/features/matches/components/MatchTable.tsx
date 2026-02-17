import React, { useState } from 'react';
import type { Match } from '../../../types/match.types';
import { fmtDate } from '../../../utils/date';
import { fmtRating, num, resultLabel } from '../../../utils/format';
import { getAutoTags, tagColor } from '../utils';
import { Button } from '../../../components/ui/Button';
import { Eye, Pencil, Trash2, Pin } from 'lucide-react';
import { MatchDetailModal } from './MatchDetailModal';

interface MatchTableProps {
  matches: Match[];
  allMatchesCount: number;
  onEdit: (m: Match) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}

export const MatchTable: React.FC<MatchTableProps> = ({ matches, allMatchesCount, onEdit, onDelete, onPin }) => {
  const [detail, setDetail] = useState<Match | null>(null);

  const th: React.CSSProperties = {
    position: 'sticky', top: 0,
    background: 'rgba(10,14,22,0.96)',
    color: 'rgba(231,238,252,0.85)',
    fontWeight: 700, fontSize: '11px',
    padding: '9px 10px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(34,48,74,0.7)',
    whiteSpace: 'nowrap',
    zIndex: 2,
  };

  const td: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: '12px',
    borderBottom: '1px solid rgba(34,48,74,0.4)',
    whiteSpace: 'nowrap',
  };

  const pill = (text: string, cls: 'win' | 'draw' | 'loss' | 'default' = 'default') => {
    const colors = {
      win:     { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', color: 'rgba(187,255,214,0.9)' },
      draw:    { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: 'rgba(255,233,196,0.9)' },
      loss:    { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', color: 'rgba(255,203,203,0.9)' },
      default: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(34,48,74,0.8)', color: 'var(--muted)' },
    };
    const c = colors[cls];
    return (
      <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '11px', background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
        {text}
      </span>
    );
  };

  if (!matches.length) {
    return <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '13px' }}>No matches match your filters.</div>;
  }

  return (
    <>
      <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(34,48,74,0.6)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Date</th>
              <th style={th}>Comp</th>
              <th style={th}>Opponent</th>
              <th style={th}>Pos</th>
              <th style={th}>Result</th>
              <th style={th}>G</th>
              <th style={th}>A</th>
              <th style={th}>Mins</th>
              <th style={th}>Rating</th>
              <th style={th}>OVR</th>
              <th style={th}>Trust</th>
              <th style={th}>Tags</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m, idx) => {
              const res = resultLabel(num(m.scoreFor), num(m.scoreAgainst));
              const isFirst = idx === allMatchesCount - 1; // oldest = debut
              const tags = getAutoTags(m, isFirst && allMatchesCount > 0 && idx === matches.length - 1);

              return (
                <tr
                  key={m.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(124,92,255,0.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, color: 'var(--muted)' }}>{matches.length - idx}</td>
                  <td style={td}>{fmtDate(m.matchDate)}</td>
                  <td style={td}>{pill(m.competition)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>
                    {m.pinned && <Pin size={10} style={{ marginRight: '4px', color: 'var(--accent)' }} />}
                    {m.opponent}
                    {m.stage !== 'N/A' && <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '4px' }}>{m.stage}</span>}
                  </td>
                  <td style={td}>{pill(m.posPlayed)}</td>
                  <td style={td}>{pill(res.text, res.cls as 'win' | 'draw' | 'loss')}</td>
                  <td style={{ ...td, color: '#22c55e', fontWeight: 700 }}>{num(m.goals)}</td>
                  <td style={{ ...td, color: '#7c5cff', fontWeight: 700 }}>{num(m.assists)}</td>
                  <td style={{ ...td, color: 'var(--muted)' }}>{m.minutesPlayed}'</td>
                  <td style={{ ...td, color: '#f59e0b', fontWeight: 700 }}>{fmtRating(num(m.matchRating))}</td>
                  <td style={{ ...td, color: 'var(--muted)' }}>{m.ovrAfter !== '' && m.ovrAfter !== null ? m.ovrAfter : '—'}</td>
                  <td style={{ ...td, color: 'var(--muted)' }}>{m.trust}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tags.map((tag) => (
                        <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: tagColor(tag) + '22', color: tagColor(tag), border: `1px solid ${tagColor(tag)}44` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button size="sm" variant="ghost" icon={<Eye size={12} />} onClick={() => setDetail(m)} title="View" />
                      <Button size="sm" variant="ghost" icon={<Pin size={12} />} onClick={() => onPin(m.id)} title="Pin" />
                      <Button size="sm" variant="ghost" icon={<Pencil size={12} />} onClick={() => onEdit(m)} title="Edit" />
                      <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => onDelete(m.id)} title="Delete" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MatchDetailModal match={detail} onClose={() => setDetail(null)} />
    </>
  );
};
