import React, { useState } from 'react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Button } from '../../ui/Button';
import { SKILL_CATEGORIES } from '../../../utils/constants';
import type { SkillSpend } from '../../../types/skill.types';
import { todayISO } from '../../../utils/date';

type SkillSpendFormValues = Omit<SkillSpend, 'id' | 'createdAt'>;

interface SkillSpendFormProps {
  onSubmit: (s: SkillSpendFormValues) => void;
  onCancel?: () => void;
}

export const SkillSpendForm: React.FC<SkillSpendFormProps> = ({ onSubmit, onCancel }) => {
  const [v, setV] = useState<SkillSpendFormValues>({
    date: todayISO(), pointsSpent: 1,
    category: 'Dribbling', attributeTarget: '',
    fromValue: 0, toValue: 0, notes: '',
  });

  const set = <K extends keyof SkillSpendFormValues>(field: K, value: SkillSpendFormValues[K]) =>
    setV((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input label="Date" type="date" value={v.date} onChange={(e) => set('date', e.target.value)} />
        <Input label="Points Spent" type="number" min={1} max={50} value={v.pointsSpent} onChange={(e) => set('pointsSpent', Number(e.target.value))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Select label="Category" value={v.category} onChange={(e) => set('category', e.target.value as SkillSpend['category'])}
          options={SKILL_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        <Input label="Attribute" value={v.attributeTarget} onChange={(e) => set('attributeTarget', e.target.value)} placeholder="Sprint Speed" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input label="From Value" type="number" min={0} max={99} value={v.fromValue} onChange={(e) => set('fromValue', Number(e.target.value))} />
        <Input label="To Value" type="number" min={0} max={99} value={v.toValue} onChange={(e) => set('toValue', Number(e.target.value))} />
      </div>
      <Textarea label="Notes" value={v.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Why did you spend these points?" />
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="green">Log Skill Spend</Button>
      </div>
    </form>
  );
};
