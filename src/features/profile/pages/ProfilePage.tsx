import React, { useState } from 'react';
import { useCareerStore } from '../../../store/career.store';
import { useMatchesStore } from '../../../store/matches.store';
import { CareerProfileForm } from '../../../components/forms/CareerProfileForm/CareerProfileForm';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Tabs } from '../../../components/ui/Tabs';
import { User, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { fmtDate } from '../../../utils/date';
import { computeKPIs } from '../../../services/analytics/kpis';
import { hydrateActiveCareerModules, hydrateCareerModules } from '../../../services/api/hydrate';

import { todayISO } from '../../../utils/date';

export const ProfilePage: React.FC = () => {
  const { career, setCareer, clearCareer, injuries, addInjury, deleteInjury, suspensions, addSuspension, deleteSuspension, pressNotes, addPressNote, deletePressNote } = useCareerStore();
  const matches = useMatchesStore((s) => s.matches);
  const toast = useToast((s) => s.show);
  const kpis = computeKPIs(matches, career?.ovr);
  const [injuryForm, setInjuryForm] = useState(false);
  const [susForm, setSusForm] = useState(false);
  const [pressForm, setPressForm] = useState(false);
  const [iv, setIv] = useState({ type: '', startDate: todayISO(), returnDate: '', matchesMissed: 0, notes: '' });
  const [sv, setSv] = useState<{ type: 'Yellow' | 'Red' | 'Accumulated'; matchesMissed: number; competition: string; date: string; notes: string }>({ type: 'Yellow', matchesMissed: 1, competition: '', date: todayISO(), notes: '' });
  const [pv, setPv] = useState({ month: '', content: '', tag: 'Other' as 'Praise' | 'Rumor' | 'Transfer' | 'Objective' | 'Other' });

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'var(--card-gradient)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="Player Profile" subtitle="Career profile, injuries, availability & press notes" icon={<User size={18} />}
        actions={career ? <Button variant="danger" size="sm" onClick={() => { void (async () => { if (window.confirm('Delete active career and linked data?')) { await clearCareer(); await hydrateActiveCareerModules(); toast('Career deleted', 'default'); } })(); }}>Delete Career</Button> : undefined}
      />

      {/* Player hero card */}
      {career && card(<>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(124,92,255,0.8),rgba(34,197,94,0.7))', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 800, flexShrink: 0 }}>
            {career.badgeUrl ? <img src={career.badgeUrl} alt="badge" style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover' }} /> : '⚽'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{career.playerName}</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--muted)' }}>
              <span>🏴 {career.nationality}</span>
              <span>📍 {career.club}</span>
              <span>📅 {career.season}</span>
              <span>⚽ {career.primaryPos}</span>
              <span>🎭 {career.archetype}</span>
              <span style={{ color: '#7c5cff', fontWeight: 700 }}>OVR {career.ovr}</span>
              <span>SP: {career.spAvailable}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
              <span>{career.height} · {career.weight}</span>
              <span>{'★'.repeat(career.weakFootStars)} weak foot</span>
              <span>{'★'.repeat(career.skillMoves)} skill moves</span>
              <span>{career.preferredFoot} foot</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            {[{ label: 'Apps', value: kpis.apps }, { label: 'Goals', value: kpis.goals, color: '#22c55e' }, { label: 'Assists', value: kpis.assists, color: '#7c5cff' }].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.045)', border: '1px solid var(--border-muted)' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{label}</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: color ?? 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </>)}

      <Tabs tabs={[{ id: 'profile', label: 'Edit Profile' }, { id: 'injuries', label: 'Injuries' }, { id: 'suspensions', label: 'Suspensions' }, { id: 'press', label: 'Press Notes' }]}>
        {(tab) => (
          <>
            {tab === 'profile' && card(
              <CareerProfileForm initial={career} onSave={(c) => { void (async () => { await setCareer(c); const activeCareerId = useCareerStore.getState().activeCareerId; if (activeCareerId) await hydrateCareerModules(activeCareerId); toast('Career saved', 'success'); })(); }} />
            )}

            {tab === 'injuries' && card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Injury Log</div>
                <Button size="sm" variant="green" icon={<PlusCircle size={13} />} onClick={() => setInjuryForm(true)}>Add</Button>
              </div>
              {injuries.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '16px', fontSize: '13px' }}>No injuries logged.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {injuries.map((i) => (
                    <div key={i.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{i.type}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{fmtDate(i.startDate)} → {i.returnDate ? fmtDate(i.returnDate) : 'Ongoing'} · {i.matchesMissed} matches missed</div>
                        {i.notes && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{i.notes}</div>}
                      </div>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteInjury(i.id)} />
                    </div>
                  ))}
                </div>
              )}
            </>)}

            {tab === 'suspensions' && card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Suspensions</div>
                <Button size="sm" variant="green" icon={<PlusCircle size={13} />} onClick={() => setSusForm(true)}>Add</Button>
              </div>
              {suspensions.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '16px', fontSize: '13px' }}>No suspensions.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {suspensions.map((s) => (
                    <div key={s.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.type} card · {s.competition}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{fmtDate(s.date)} · {s.matchesMissed} match(es) ban</div>
                      </div>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteSuspension(s.id)} />
                    </div>
                  ))}
                </div>
              )}
            </>)}

            {tab === 'press' && card(<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Press / Agent Notes</div>
                <Button size="sm" variant="green" icon={<PlusCircle size={13} />} onClick={() => setPressForm(true)}>Add</Button>
              </div>
              {pressNotes.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '16px', fontSize: '13px' }}>No press notes yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pressNotes.map((n) => (
                    <div key={n.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-muted)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px' }}>{n.month} · {n.tag}</div>
                        <div style={{ fontSize: '13px' }}>{n.content}</div>
                      </div>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deletePressNote(n.id)} />
                    </div>
                  ))}
                </div>
              )}
            </>)}
          </>
        )}
      </Tabs>

      {/* Injury Modal */}
      <Modal open={injuryForm} onClose={() => setInjuryForm(false)} title="Log Injury" width="480px"
        actions={<>
          <Button variant="ghost" onClick={() => setInjuryForm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { addInjury(iv); setInjuryForm(false); toast('Injury logged', 'default'); }}>Log</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Injury Type" value={iv.type} onChange={(e) => setIv((v) => ({ ...v, type: e.target.value }))} placeholder="Hamstring strain" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Start Date" type="date" value={iv.startDate} onChange={(e) => setIv((v) => ({ ...v, startDate: e.target.value }))} />
            <Input label="Return Date" type="date" value={iv.returnDate} onChange={(e) => setIv((v) => ({ ...v, returnDate: e.target.value }))} />
          </div>
          <Input label="Matches Missed" type="number" min={0} value={iv.matchesMissed} onChange={(e) => setIv((v) => ({ ...v, matchesMissed: Number(e.target.value) }))} />
          <Textarea label="Notes" value={iv.notes} onChange={(e) => setIv((v) => ({ ...v, notes: e.target.value }))} />
        </div>
      </Modal>

      {/* Suspension Modal */}
      <Modal open={susForm} onClose={() => setSusForm(false)} title="Log Suspension" width="420px"
        actions={<>
          <Button variant="ghost" onClick={() => setSusForm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { addSuspension(sv); setSusForm(false); toast('Suspension logged', 'default'); }}>Log</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Select label="Type" value={sv.type} onChange={(e) => setSv((v) => ({ ...v, type: e.target.value as typeof sv.type }))} options={['Yellow','Red','Accumulated'].map((t) => ({ value: t, label: t }))} />
          <Input label="Competition" value={sv.competition} onChange={(e) => setSv((v) => ({ ...v, competition: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Date" type="date" value={sv.date} onChange={(e) => setSv((v) => ({ ...v, date: e.target.value }))} />
            <Input label="Matches Banned" type="number" min={1} value={sv.matchesMissed} onChange={(e) => setSv((v) => ({ ...v, matchesMissed: Number(e.target.value) }))} />
          </div>
          <Textarea label="Notes" value={sv.notes} onChange={(e) => setSv((v) => ({ ...v, notes: e.target.value }))} />
        </div>
      </Modal>

      {/* Press note modal */}
      <Modal open={pressForm} onClose={() => setPressForm(false)} title="Add Press Note" width="480px"
        actions={<>
          <Button variant="ghost" onClick={() => setPressForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addPressNote(pv); setPressForm(false); toast('Note added', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Month (YYYY-MM)" value={pv.month} onChange={(e) => setPv((v) => ({ ...v, month: e.target.value }))} placeholder="2026-09" />
            <Select label="Tag" value={pv.tag} onChange={(e) => setPv((v) => ({ ...v, tag: e.target.value as typeof pv.tag }))} options={['Praise','Rumor','Transfer','Objective','Other'].map((t) => ({ value: t, label: t }))} />
          </div>
          <Textarea label="Note" value={pv.content} onChange={(e) => setPv((v) => ({ ...v, content: e.target.value }))} placeholder="Coach praised me after UCL debut…" />
        </div>
      </Modal>
    </div>
  );
};

