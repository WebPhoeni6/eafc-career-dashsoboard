import React, { useMemo, useState } from 'react';
import type { Match } from '../../../types/match.types';
import { fmtDate } from '../../../utils/date';
import { fmtRating, num, resultLabel } from '../../../utils/format';
import { getAutoTags, tagColor } from '../utils';
import { Button } from '../../../components/ui/Button';
import { Eye, Pencil, Trash2, Pin, ImageIcon } from 'lucide-react';
import { MatchDetailModal } from './MatchDetailModal';

interface MatchTableProps {
  matches: Match[];
  onEdit: (m: Match) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onUploadImage: (id: string, file: File) => Promise<void>;
  onDeleteImage: (id: string) => Promise<void>;
}

type SortDirection = 'asc' | 'desc';
type SortKey =
  | 'index'
  | 'matchDate'
  | 'competition'
  | 'opponent'
  | 'posPlayed'
  | 'result'
  | 'goals'
  | 'assists'
  | 'minutesPlayed'
  | 'matchRating'
  | 'ovrAfter'
  | 'trust'
  | 'image'
  | 'tags';

const trustOrder: Record<Match['trust'], number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Full: 4,
};

export const MatchTable: React.FC<MatchTableProps> = ({
  matches,
  onEdit,
  onDelete,
  onPin,
  onUploadImage,
  onDeleteImage,
}) => {
  const [detail, setDetail] = useState<Match | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'matchDate',
    direction: 'desc',
  });

  const th: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    background: 'rgba(10,14,22,0.96)',
    color: 'rgba(231,238,252,0.85)',
    fontWeight: 700,
    fontSize: '11px',
    padding: '9px 10px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(34,48,74,0.7)',
    whiteSpace: 'nowrap',
    zIndex: 2,
  };

  const td: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: '12px',
    borderBottom: '1px solid var(--border-muted)',
    whiteSpace: 'nowrap',
  };

  const pill = (text: string, cls: 'win' | 'draw' | 'loss' | 'default' = 'default') => {
    const colors = {
      win: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', color: 'rgba(187,255,214,0.9)' },
      draw: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: 'rgba(255,233,196,0.9)' },
      loss: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', color: 'rgba(255,203,203,0.9)' },
      default: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(34,48,74,0.8)', color: 'var(--muted)' },
    };
    const c = colors[cls];
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '999px',
          fontSize: '11px',
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.color,
        }}
      >
        {text}
      </span>
    );
  };

  const oldestMatchId = useMemo(() => {
    if (!matches.length) return null;
    const sorted = [...matches].sort((a, b) => {
      const da = `${a.matchDate || ''}#${a.createdAt || ''}`;
      const db = `${b.matchDate || ''}#${b.createdAt || ''}`;
      return da.localeCompare(db);
    });
    return sorted[0]?.id || null;
  }, [matches]);

  const getResultRank = (m: Match): number => {
    const res = resultLabel(num(m.scoreFor), num(m.scoreAgainst));
    if (res.cls === 'win') return 3;
    if (res.cls === 'draw') return 2;
    return 1;
  };

  const getTagsCount = (m: Match): number => getAutoTags(m, m.id === oldestMatchId).length;

  const sortedMatches = useMemo(() => {
    const dir = sort.direction === 'asc' ? 1 : -1;

    return [...matches]
      .map((m, idx) => ({ m, idx }))
      .sort((a, b) => {
        let cmp = 0;
        switch (sort.key) {
          case 'index': {
            const aKey = `${a.m.matchDate || ''}#${a.m.createdAt || ''}`;
            const bKey = `${b.m.matchDate || ''}#${b.m.createdAt || ''}`;
            cmp = aKey.localeCompare(bKey);
            break;
          }
          case 'matchDate': {
            const aKey = `${a.m.matchDate || ''}#${a.m.createdAt || ''}`;
            const bKey = `${b.m.matchDate || ''}#${b.m.createdAt || ''}`;
            cmp = aKey.localeCompare(bKey);
            break;
          }
          case 'competition':
            cmp = a.m.competition.localeCompare(b.m.competition);
            break;
          case 'opponent':
            cmp = a.m.opponent.localeCompare(b.m.opponent);
            break;
          case 'posPlayed':
            cmp = a.m.posPlayed.localeCompare(b.m.posPlayed);
            break;
          case 'result':
            cmp = getResultRank(a.m) - getResultRank(b.m);
            break;
          case 'goals':
            cmp = num(a.m.goals) - num(b.m.goals);
            break;
          case 'assists':
            cmp = num(a.m.assists) - num(b.m.assists);
            break;
          case 'minutesPlayed':
            cmp = num(a.m.minutesPlayed) - num(b.m.minutesPlayed);
            break;
          case 'matchRating':
            cmp = num(a.m.matchRating) - num(b.m.matchRating);
            break;
          case 'ovrAfter': {
            const aOvr = a.m.ovrAfter === '' ? -1 : Number(a.m.ovrAfter);
            const bOvr = b.m.ovrAfter === '' ? -1 : Number(b.m.ovrAfter);
            cmp = aOvr - bOvr;
            break;
          }
          case 'trust':
            cmp = trustOrder[a.m.trust] - trustOrder[b.m.trust];
            break;
          case 'image':
            cmp = Number(Boolean(a.m.performanceImageUrl)) - Number(Boolean(b.m.performanceImageUrl));
            break;
          case 'tags':
            cmp = getTagsCount(a.m) - getTagsCount(b.m);
            break;
          default:
            cmp = 0;
            break;
        }

        if (cmp === 0) return a.idx - b.idx;
        return cmp * dir;
      })
      .map((x) => x.m);
  }, [matches, oldestMatchId, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'opponent' || key === 'competition' || key === 'posPlayed' || key === 'trust' ? 'asc' : 'desc' };
    });
  };

  const sortLabel = (key: SortKey) => {
    if (sort.key !== key) return '?';
    return sort.direction === 'asc' ? '?' : '?';
  };

  const sortableHeader = (label: string, key: SortKey, align: React.CSSProperties['textAlign'] = 'left') => (
    <th style={{ ...th, textAlign: align }}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: 0,
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.8 }}>{sortLabel(key)}</span>
      </button>
    </th>
  );

  if (!matches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '13px' }}>
        No matches match your filters.
      </div>
    );
  }

  return (
    <>
      <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid var(--border-muted)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '760px' }}>
          <thead>
            <tr>
              {sortableHeader('#', 'index')}
              {sortableHeader('Date', 'matchDate')}
              {sortableHeader('Comp', 'competition')}
              {sortableHeader('Opponent', 'opponent')}
              {sortableHeader('Pos', 'posPlayed')}
              {sortableHeader('Result', 'result')}
              {sortableHeader('G', 'goals', 'center')}
              {sortableHeader('A', 'assists', 'center')}
              {sortableHeader('Mins', 'minutesPlayed', 'center')}
              {sortableHeader('Rating', 'matchRating', 'center')}
              {sortableHeader('OVR', 'ovrAfter', 'center')}
              {sortableHeader('Trust', 'trust', 'center')}
              {sortableHeader('Image', 'image', 'center')}
              {sortableHeader('Tags', 'tags')}
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedMatches.map((m, idx) => {
              const res = resultLabel(num(m.scoreFor), num(m.scoreAgainst));
              const tags = getAutoTags(m, m.id === oldestMatchId);

              return (
                <tr
                  key={m.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(124,92,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ ...td, color: 'var(--muted)' }}>{idx + 1}</td>
                  <td style={td}>{fmtDate(m.matchDate)}</td>
                  <td style={td}>{pill(m.competition)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>
                    {m.pinned && <Pin size={10} style={{ marginRight: '4px', color: 'var(--accent)' }} />}
                    {m.opponent}
                    {m.stage !== 'N/A' && (
                      <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '4px' }}>{m.stage}</span>
                    )}
                  </td>
                  <td style={td}>{pill(m.posPlayed)}</td>
                  <td style={td}>{pill(res.text, res.cls as 'win' | 'draw' | 'loss')}</td>
                  <td style={{ ...td, color: '#22c55e', fontWeight: 700, textAlign: 'center' }}>{num(m.goals)}</td>
                  <td style={{ ...td, color: '#7c5cff', fontWeight: 700, textAlign: 'center' }}>{num(m.assists)}</td>
                  <td style={{ ...td, color: 'var(--muted)', textAlign: 'center' }}>{m.minutesPlayed}'</td>
                  <td style={{ ...td, color: '#f59e0b', fontWeight: 700, textAlign: 'center' }}>
                    {fmtRating(num(m.matchRating))}
                  </td>
                  <td style={{ ...td, color: 'var(--muted)', textAlign: 'center' }}>
                    {m.ovrAfter !== '' && m.ovrAfter !== null ? m.ovrAfter : '-'}
                  </td>
                  <td style={{ ...td, color: 'var(--muted)', textAlign: 'center' }}>{m.trust}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {m.performanceImageUrl ? (
                      <ImageIcon size={14} color="var(--accent)" />
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>-</span>
                    )}
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '999px',
                            background: tagColor(tag) + '22',
                            color: tagColor(tag),
                            border: `1px solid ${tagColor(tag)}44`,
                          }}
                        >
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

      <MatchDetailModal
        match={detail}
        onClose={() => setDetail(null)}
        onUploadImage={onUploadImage}
        onDeleteImage={onDeleteImage}
      />
    </>
  );
};
