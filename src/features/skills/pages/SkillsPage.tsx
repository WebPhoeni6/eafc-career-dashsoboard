import React, { useState } from 'react';
import { useSkillsStore } from '../../../store/skills.store';
import { useCareerStore } from '../../../store/career.store';
import { SkillSpendForm } from '../../../components/forms/SkillSpendForm/SkillSpendForm';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Tabs } from '../../../components/ui/Tabs';
import { Dumbbell, PlusCircle, Target, Trash2 } from 'lucide-react';
import { fmtDate } from '../../../utils/date';
import { useToast } from '../../../hooks/useToast';

export const SkillsPage: React.FC = () => {
  const { skillSpends, archetypeStage, trainingLogs, attributeTargets, addSkillSpend, deleteSkillSpend, deleteTrainingLog, addAttributeTarget, updateAttributeTarget, deleteAttributeTarget } = useSkillsStore();
  const { career } = useCareerStore();
  const toast = useToast((s) => s.show);
  const [spendForm, setSpendForm] = useState(false);
  const [targetForm, setTargetForm] = useState(false);
  const [tAttr, setTAttr] = useState(''); const [tFrom, setTFrom] = useState(0); const [tTo, setTTo] = useState(0); const [tDeadline, setTDeadline] = useState('');

  const totalSpent = skillSpends.reduce((s, x) => s + x.pointsSpent, 0);

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'var(--card-gradient)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="Skills & Training" subtitle="Track skill point spending and attribute targets" icon={<Dumbbell size={18} />}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="green" size="sm" icon={<PlusCircle size={13} />} onClick={() => setSpendForm(true)}>Log Spend</Button>
            <Button variant="ghost" size="sm" icon={<Target size={13} />} onClick={() => setTargetForm(true)}>Add Target</Button>
          </div>
        }
      />

      <Tabs tabs={[
        { id: 'spends', label: 'Skill Spends' },
        { id: 'targets', label: 'Attribute Targets' },
        { id: 'archetype', label: 'Archetype' },
        { id: 'training', label: 'Training Logs' },
      ]}>
        {(tab) => (
          <>
            {tab === 'spends' && card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Skill Point Spending</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total spent: <strong style={{ color: 'var(--accent)' }}>{totalSpent} SP</strong> · Available: <strong style={{ color: '#22c55e' }}>{career?.spAvailable ?? 0} SP</strong></div>
              </div>
              {skillSpends.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No skill spends logged yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ color: 'var(--muted)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
                    <th>SP</th><th>Category</th><th style={{ textAlign: 'left' }}>Attribute</th><th>Before</th><th>After</th><th style={{ textAlign: 'left' }}>Notes</th><th />
                  </tr></thead>
                  <tbody>
                    {[...skillSpends].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((s) => (
                      <tr key={s.id} style={{ borderTop: '1px solid var(--border-muted)' }}>
                        <td style={{ padding: '7px 8px' }}>{fmtDate(s.date)}</td>
                        <td style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 700 }}>{s.pointsSpent}</td>
                        <td style={{ textAlign: 'center' }}>{s.category}</td>
                        <td>{s.attributeTarget}</td>
                        <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{s.fromValue}</td>
                        <td style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{s.toValue}</td>
                        <td style={{ color: 'var(--muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.notes}</td>
                        <td><Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteSkillSpend(s.id)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>)}

            {tab === 'targets' && card(<>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Attribute Targets</div>
              {attributeTargets.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No targets set yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {attributeTargets.map((t) => {
                    const pct = Math.min(100, ((t.currentValue / t.targetValue) * 100));
                    return (
                      <div key={t.id} style={{ padding: '12px', borderRadius: '12px', background: t.achieved ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${t.achieved ? 'rgba(34,197,94,0.3)' : 'rgba(34,48,74,0.5)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{t.attribute}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{t.currentValue} → {t.targetValue} · by {t.deadline}</span>
                            {t.achieved ? '✅' : <Button size="sm" variant="green" onClick={() => updateAttributeTarget(t.id, { achieved: true, currentValue: t.targetValue })}>Mark Done</Button>}
                            <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteAttributeTarget(t.id)} />
                          </div>
                        </div>
                        <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: t.achieved ? '#22c55e' : '#7c5cff', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>)}

            {tab === 'archetype' && card(<>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Archetype: {career?.archetype ?? 'Not set'}</div>
              {archetypeStage ? (
                <>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '10px' }}>Stage {archetypeStage.stage} · Next unlock: <strong>{archetypeStage.nextUnlock}</strong></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {archetypeStage.checklist.map((item, i) => (
                      <label key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={item.unlocked} readOnly /> {item.perk}
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No archetype stage data. Add it below.</div>
              )}
            </>)}

            {tab === 'training' && card(<>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Training Logs</div>
              {trainingLogs.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No training logs yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ color: 'var(--muted)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Week</th><th>Grade</th><th>XP</th><th style={{ textAlign: 'left' }}>Notes</th><th />
                  </tr></thead>
                  <tbody>
                    {trainingLogs.map((l) => (
                      <tr key={l.id} style={{ borderTop: '1px solid var(--border-muted)' }}>
                        <td style={{ padding: '7px 8px' }}>{l.week}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: l.grade === 'A' ? '#22c55e' : l.grade === 'B' ? '#f59e0b' : '#ef4444' }}>{l.grade}</td>
                        <td style={{ textAlign: 'center', color: 'var(--accent)' }}>{l.xpGained}</td>
                        <td style={{ color: 'var(--muted)' }}>{l.notes}</td>
                        <td><Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteTrainingLog(l.id)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>)}
          </>
        )}
      </Tabs>

      <Modal open={spendForm} onClose={() => setSpendForm(false)} title="Log Skill Spend" width="560px">
        <SkillSpendForm onSubmit={(s) => { addSkillSpend(s); setSpendForm(false); toast('Skill spend logged ✅', 'success'); }} onCancel={() => setSpendForm(false)} />
      </Modal>

      <Modal open={targetForm} onClose={() => setTargetForm(false)} title="Add Attribute Target" width="420px"
        actions={<>
          <Button variant="ghost" onClick={() => setTargetForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addAttributeTarget({ attribute: tAttr, currentValue: tFrom, targetValue: tTo, deadline: tDeadline, achieved: false, notes: '' }); setTargetForm(false); toast('Target added 🎯', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Attribute" value={tAttr} onChange={(e) => setTAttr(e.target.value)} placeholder="Sprint Speed" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Current" type="number" value={tFrom} onChange={(e) => setTFrom(Number(e.target.value))} />
            <Input label="Target" type="number" value={tTo} onChange={(e) => setTTo(Number(e.target.value))} />
          </div>
          <Input label="Deadline (YYYY-MM)" value={tDeadline} onChange={(e) => setTDeadline(e.target.value)} placeholder="2026-12" />
        </div>
      </Modal>
    </div>
  );
};

