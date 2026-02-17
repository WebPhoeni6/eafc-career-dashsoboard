import React, { useState } from 'react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { ARCHETYPES, POSITIONS } from '../../../utils/constants';
import type { CareerProfile } from '../../../types/career.types';
import { validateCareerForm, defaultCareerValues, type CareerFormValues } from './schema';
import { nowISO } from '../../../utils/date';

interface CareerProfileFormProps {
  initial?: CareerProfile | null;
  onSave: (c: CareerProfile) => void;
}

export const CareerProfileForm: React.FC<CareerProfileFormProps> = ({ initial, onSave }) => {
  const [values, setValues] = useState<CareerFormValues>(
    initial
      ? { ...initial }
      : defaultCareerValues(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: keyof CareerFormValues, value: unknown) =>
    setValues((v) => ({ ...v, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateCareerForm(values);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSave({ ...values, updatedAt: nowISO() });
  };

  const starOptions = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: '★'.repeat(n) }));

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input label="Player Name" value={values.playerName} onChange={(e) => set('playerName', e.target.value)} error={errors.playerName} required />
        <Input label="Nationality" value={values.nationality} onChange={(e) => set('nationality', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Select label="Archetype" value={values.archetype} onChange={(e) => set('archetype', e.target.value as CareerProfile['archetype'])}
          options={ARCHETYPES.map((a) => ({ value: a, label: a }))} />
        <Select label="Primary Position" value={values.primaryPos} onChange={(e) => set('primaryPos', e.target.value as CareerProfile['primaryPos'])}
          options={POSITIONS.map((p) => ({ value: p, label: p }))} />
        <Input label="Club" value={values.club} onChange={(e) => set('club', e.target.value)} error={errors.club} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Input label="Season" value={values.season} onChange={(e) => set('season', e.target.value)} error={errors.season} placeholder="2026/27" required />
        <Input label="OVR" type="number" min={40} max={99} value={values.ovr} onChange={(e) => set('ovr', Number(e.target.value))} error={errors.ovr} required />
        <Input label="Skill Points" type="number" min={0} max={200} value={values.spAvailable} onChange={(e) => set('spAvailable', Number(e.target.value))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
        <Input label="Height" value={values.height} onChange={(e) => set('height', e.target.value)} placeholder="5'9&quot;" />
        <Input label="Weight" value={values.weight} onChange={(e) => set('weight', e.target.value)} placeholder="154 lbs" />
        <Select label="Weak Foot" value={String(values.weakFootStars)} onChange={(e) => set('weakFootStars', Number(e.target.value) as CareerProfile['weakFootStars'])} options={starOptions} />
        <Select label="Skill Moves" value={String(values.skillMoves)} onChange={(e) => set('skillMoves', Number(e.target.value) as CareerProfile['skillMoves'])} options={starOptions} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Select label="Preferred Foot" value={values.preferredFoot} onChange={(e) => set('preferredFoot', e.target.value as 'Left' | 'Right')}
          options={[{ value: 'Right', label: 'Right' }, { value: 'Left', label: 'Left' }]} />
        <Input label="Badge URL (optional)" value={values.badgeUrl ?? ''} onChange={(e) => set('badgeUrl', e.target.value)} placeholder="https://…" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="green">Save Career Profile</Button>
      </div>
    </form>
  );
};
