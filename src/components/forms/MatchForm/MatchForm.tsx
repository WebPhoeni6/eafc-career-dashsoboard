import React, { useEffect, useState } from 'react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { COMPETITIONS, STAGES, POSITIONS, TRUST_LEVELS, MATCH_TEMPLATES } from '../../../utils/constants';
import type { Match } from '../../../types/match.types';
import { todayISO } from '../../../utils/date';
import { Zap } from 'lucide-react';

type MatchFormValues = Omit<Match, 'id' | 'createdAt' | 'updatedAt'>;

function normalizeMatchDate(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function defaultMatchValues(): MatchFormValues {
  return {
    competition: 'League', stage: 'N/A', matchDate: todayISO(),
    opponent: '', posPlayed: 'RW',
    scoreFor: 0, scoreAgainst: 0, minutesPlayed: 90,
    matchRating: 7.0, goals: 0, assists: 0,
    shots: 0, shotsOnTarget: 0, xG: 0,
    keyPasses: 0, chancesCreated: 0,
    dribblesAttempted: 0, dribblesCompleted: 0,
    passAccuracy: 0, crossAccuracy: 0,
    motm: false, clutchMoment: false,
    objectivesCompleted: false, objectivesNotes: '',
    opponentStrength: 3,
    ovrAfter: '', spAfter: '',
    trust: 'Full', notes: '', pinned: false,
  };
}

const MATCH_FORM_KEYS = Object.keys(defaultMatchValues()) as Array<keyof MatchFormValues>;

function pickFormValues(source?: Partial<MatchFormValues> | null): Partial<MatchFormValues> {
  if (!source || typeof source !== 'object') return {};
  const out: Partial<MatchFormValues> = {};
  for (const key of MATCH_FORM_KEYS) {
    if (source[key] !== undefined) {
      (out as Record<string, unknown>)[key] = source[key] as unknown;
    }
  }
  return out;
}

interface MatchFormProps {
  initial?: Partial<MatchFormValues>;
  prefill?: Partial<MatchFormValues> | null;
  prefillVersion?: number;
  draftKey?: string;
  onSubmit: (m: MatchFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export const MatchForm: React.FC<MatchFormProps> = ({ initial, prefill, prefillVersion, draftKey, onSubmit, onCancel, submitLabel = 'Add Match' }) => {
  const [v, setV] = useState<MatchFormValues>(() => {
    const initialValues = pickFormValues(initial);
    const base = {
      ...defaultMatchValues(),
      ...initialValues,
      ...(normalizeMatchDate(initialValues.matchDate) ? { matchDate: normalizeMatchDate(initialValues.matchDate) } : {}),
    };

    if (!draftKey || initial) return base;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return base;
      const parsed = pickFormValues(JSON.parse(raw) as Partial<MatchFormValues>);
      const normalizedDate = normalizeMatchDate(parsed.matchDate);
      return {
        ...base,
        ...parsed,
        ...(normalizedDate ? { matchDate: normalizedDate } : {}),
      };
    } catch {
      return base;
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickScore, setQuickScore] = useState('');

  useEffect(() => {
    if (!prefill) return;
    const safePrefill = pickFormValues(prefill);
    const normalizedDate = normalizeMatchDate(safePrefill.matchDate);
    setV((prev) => ({
      ...prev,
      ...safePrefill,
      ...(normalizedDate ? { matchDate: normalizedDate } : {}),
    }));
  }, [prefillVersion]);

  useEffect(() => {
    setQuickScore(`${v.scoreFor}-${v.scoreAgainst}`);
  }, [v.scoreFor, v.scoreAgainst]);

  useEffect(() => {
    if (!draftKey || initial) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(v));
    } catch {
      // no-op
    }
  }, [v, draftKey, initial]);

  const set = <K extends keyof MatchFormValues>(field: K, value: MatchFormValues[K]) =>
    setV((prev) => ({ ...prev, [field]: value }));

  const applyTemplate = (templateId: string) => {
    const t = MATCH_TEMPLATES.find((x) => x.id === templateId);
    if (t) setV((prev) => ({ ...prev, ...t.defaults }));
  };

  const applyQuickScore = (raw: string) => {
    const match = raw.match(/^\s*(\d{1,2})\s*[-:]\s*(\d{1,2})\s*$/);
    if (!match) return;
    const scoreFor = Math.max(0, Math.min(30, Number(match[1])));
    const scoreAgainst = Math.max(0, Math.min(30, Number(match[2])));
    setV((prev) => ({ ...prev, scoreFor, scoreAgainst }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const normalizedDate = normalizeMatchDate(v.matchDate);
    if (!normalizedDate) errs.matchDate = 'Date is required';
    if (!v.opponent.trim()) errs.opponent = 'Opponent is required';
    if (v.matchRating < 0 || v.matchRating > 10) errs.matchRating = 'Rating must be 0–10';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const payload = {
      ...defaultMatchValues(),
      ...pickFormValues(v),
      matchDate: normalizedDate,
    };
    const result = onSubmit(payload);
    if (draftKey && !initial) {
      Promise.resolve(result)
        .then(() => {
          localStorage.removeItem(draftKey);
        })
        .catch(() => {
          // keep draft if submit fails
        });
    }
  };

  const clearDraft = () => {
    if (!draftKey || initial) return;
    localStorage.removeItem(draftKey);
    const safePrefill = pickFormValues(prefill);
    setV({
      ...defaultMatchValues(),
      ...safePrefill,
      ...(normalizeMatchDate(safePrefill.matchDate) ? { matchDate: normalizeMatchDate(safePrefill.matchDate) } : {}),
    });
    setErrors({});
  };

  const g2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' } as const;
  const g3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' } as const;
  const g4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' } as const;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Templates */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)', alignSelf: 'center' }}>Templates:</span>
        {MATCH_TEMPLATES.map((t) => (
          <Button key={t.id} type="button" variant="ghost" size="sm" icon={<Zap size={12} />} onClick={() => applyTemplate(t.id)}>
            {t.name}
          </Button>
        ))}
      </div>

      {/* Core */}
      <div style={g2}>
        <Select label="Competition" value={v.competition}
          onChange={(e) => set('competition', e.target.value as Match['competition'])}
          options={COMPETITIONS.map((c) => ({ value: c, label: c }))} />
        <Select label="Stage" value={v.stage}
          onChange={(e) => set('stage', e.target.value as Match['stage'])}
          options={STAGES.map((s) => ({ value: s, label: s }))} />
      </div>

      <div style={g2}>
        <Input label="Date" type="date" value={v.matchDate} onChange={(e) => set('matchDate', e.target.value)} error={errors.matchDate} />
        <Input label="Opponent" value={v.opponent} onChange={(e) => set('opponent', e.target.value)} error={errors.opponent} required />
      </div>

      <div style={g3}>
        <Select label="Position Played" value={v.posPlayed}
          onChange={(e) => set('posPlayed', e.target.value as Match['posPlayed'])}
          options={POSITIONS.map((p) => ({ value: p, label: p }))} />
        <Input label="Score (For)" type="number" min={0} max={30} value={v.scoreFor} onChange={(e) => set('scoreFor', Number(e.target.value))} />
        <Input label="Score (Against)" type="number" min={0} max={30} value={v.scoreAgainst} onChange={(e) => set('scoreAgainst', Number(e.target.value))} />
      </div>

      <div style={g2}>
        <Input
          label="Quick Scoreline"
          value={quickScore}
          onChange={(e) => setQuickScore(e.target.value)}
          onBlur={(e) => applyQuickScore(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyQuickScore(quickScore);
            }
          }}
          hint="Type like 2-1 (or 2:1), then press Enter"
        />
      </div>

      <div style={g4}>
        <Input label="Match Rating" type="number" step="0.1" min={0} max={10} value={v.matchRating} onChange={(e) => set('matchRating', Number(e.target.value))} error={errors.matchRating} />
        <Input label="Goals" type="number" min={0} max={15} value={v.goals} onChange={(e) => set('goals', Number(e.target.value))} />
        <Input label="Assists" type="number" min={0} max={15} value={v.assists} onChange={(e) => set('assists', Number(e.target.value))} />
        <Input label="Minutes Played" type="number" min={0} max={120} value={v.minutesPlayed} onChange={(e) => set('minutesPlayed', Number(e.target.value))} />
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((x) => !x)}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}
      >
        {showAdvanced ? '▾ Hide advanced stats' : '▸ Show advanced stats (shots, xG, dribbles…)'}
      </button>

      {showAdvanced && (
        <>
          <div style={g4}>
            <Input label="Shots" type="number" min={0} value={v.shots} onChange={(e) => set('shots', Number(e.target.value))} />
            <Input label="Shots on Target" type="number" min={0} value={v.shotsOnTarget} onChange={(e) => set('shotsOnTarget', Number(e.target.value))} />
            <Input label="xG" type="number" step="0.01" min={0} value={v.xG} onChange={(e) => set('xG', Number(e.target.value))} />
            <Input label="Key Passes" type="number" min={0} value={v.keyPasses} onChange={(e) => set('keyPasses', Number(e.target.value))} />
          </div>
          <div style={g4}>
            <Input label="Chances Created" type="number" min={0} value={v.chancesCreated} onChange={(e) => set('chancesCreated', Number(e.target.value))} />
            <Input label="Dribbles Attempted" type="number" min={0} value={v.dribblesAttempted} onChange={(e) => set('dribblesAttempted', Number(e.target.value))} />
            <Input label="Dribbles Completed" type="number" min={0} value={v.dribblesCompleted} onChange={(e) => set('dribblesCompleted', Number(e.target.value))} />
            <Input label="Pass Accuracy %" type="number" min={0} max={100} value={v.passAccuracy} onChange={(e) => set('passAccuracy', Number(e.target.value))} />
          </div>
          <div style={g3}>
            <Input label="Cross Accuracy %" type="number" min={0} max={100} value={v.crossAccuracy} onChange={(e) => set('crossAccuracy', Number(e.target.value))} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Opponent Strength (1–5)</label>
              <input type="range" min={1} max={5} value={v.opponentStrength}
                onChange={(e) => set('opponentStrength', Number(e.target.value) as Match['opponentStrength'])}
                style={{ accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{'⭐'.repeat(v.opponentStrength)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Flags</label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={v.motm} onChange={(e) => set('motm', e.target.checked)} /> MOTM
              </label>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={v.clutchMoment} onChange={(e) => set('clutchMoment', e.target.checked)} /> Clutch Moment
              </label>
            </div>
          </div>
        </>
      )}

      {/* Objectives */}
      <div style={g2}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" checked={v.objectivesCompleted} onChange={(e) => set('objectivesCompleted', e.target.checked)} />
            Match Objectives Completed
          </label>
        </div>
        <Input label="Objectives Notes" value={v.objectivesNotes} onChange={(e) => set('objectivesNotes', e.target.value)} placeholder="Score 1 goal, keep possession…" />
      </div>

      {/* Post-match */}
      <div style={g4}>
        <Input label="OVR After" type="number" min={40} max={99} value={v.ovrAfter === '' ? '' : v.ovrAfter} onChange={(e) => set('ovrAfter', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Optional" />
        <Input label="Skill Points After" type="number" min={0} max={200} value={v.spAfter === '' ? '' : v.spAfter} onChange={(e) => set('spAfter', e.target.value === '' ? '' : Number(e.target.value))} placeholder="Optional" />
        <Select label="Manager Trust" value={v.trust} onChange={(e) => set('trust', e.target.value as Match['trust'])} options={TRUST_LEVELS.map((t) => ({ value: t, label: t }))} />
        <div />
      </div>

      <Textarea label="Notes" value={v.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Highlights, misses, vibes…" />

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {draftKey && !initial && (
          <Button type="button" variant="ghost" onClick={clearDraft}>
            Clear Draft
          </Button>
        )}
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="green">{submitLabel}</Button>
      </div>
    </form>
  );
};

