import React from 'react';
import type { FormData } from '../../../services/analytics/kpis';
import { fmtRating } from '../../../utils/format';

interface FormMeterProps {
  form: FormData;
}

export const FormMeter: React.FC<FormMeterProps> = ({ form }) => {
  const { last5AvgRating, gaStreak, ratingTrend } = form;

  const ratingColor =
    last5AvgRating >= 8 ? '#22c55e' :
    last5AvgRating >= 6.5 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      padding: '16px',
      borderRadius: '16px',
      border: '1px solid rgba(34,48,74,0.75)',
      background: 'rgba(255,255,255,0.03)',
      display: 'flex',
      gap: '24px',
      alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Form (Last 5)</div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: ratingColor }}>{fmtRating(last5AvgRating)}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Average rating</div>
      </div>

      {/* Rating bars */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px' }}>
        {(ratingTrend.length ? ratingTrend : [0, 0, 0, 0, 0]).map((r, i) => (
          <div
            key={i}
            title={`${fmtRating(r)}`}
            style={{
              width: '14px',
              height: `${Math.max(4, (r / 10) * 40)}px`,
              borderRadius: '3px',
              background: r >= 8 ? '#22c55e' : r >= 6.5 ? '#f59e0b' : '#ef4444',
              opacity: r === 0 ? 0.2 : 0.9,
              transition: 'height 0.3s ease',
            }}
          />
        ))}
        <div style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center', marginLeft: '4px' }}>←5</div>
      </div>

      <div style={{ borderLeft: '1px solid rgba(34,48,74,0.6)', paddingLeft: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>G/A Streak</div>
        {gaStreak > 0 ? (
          <>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>🔥 {gaStreak}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>consecutive matches</div>
          </>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>No active streak</div>
        )}
      </div>
    </div>
  );
};
