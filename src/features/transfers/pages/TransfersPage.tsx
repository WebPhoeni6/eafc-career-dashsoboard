import React, { useState } from 'react';
import { useTransfersStore } from '../../../store/transfers.store';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Tabs } from '../../../components/ui/Tabs';
import { ArrowLeftRight, PlusCircle, Trash2 } from 'lucide-react';
import { fmtDate } from '../../../utils/date';
import { useToast } from '../../../hooks/useToast';
import type { TransferOffer, Contract } from '../../../types/transfer.types';
import { todayISO } from '../../../utils/date';

function scoreOffer(o: Partial<TransferOffer>): number {
  let score = 0;
  if (o.role === 'Crucial') score += 35;
  else if (o.role === 'Important') score += 25;
  else if (o.role === 'Rotation') score += 10;
  if (o.hasUCL) score += 25;
  const leagueScores: Record<string, number> = { 'Premier League': 20, 'La Liga': 18, 'Bundesliga': 16, 'Serie A': 15, 'Ligue 1': 12, 'Eredivisie': 10 };
  score += leagueScores[o.league ?? ''] ?? 5;
  return Math.min(100, score);
}

const defaultOffer = (): Omit<TransferOffer, 'id' | 'createdAt'> => ({
  club: '', league: '', country: '', role: 'Important', wage: '', fee: '',
  hasUCL: false, status: 'Pending', receivedDate: todayISO(), notes: '', score: 0,
});

export const TransfersPage: React.FC = () => {
  const { offers, contracts, agentNotes, addOffer, updateOffer, deleteOffer, addContract, deleteContract, addAgentNote, deleteAgentNote } = useTransfersStore();
  const toast = useToast((s) => s.show);
  const [offerForm, setOfferForm] = useState(false);
  const [noteForm, setNoteForm] = useState(false);
  const [contractForm, setContractForm] = useState(false);
  const [ov, setOv] = useState(defaultOffer());
  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState<'Strategy' | 'Rumor' | 'Goal' | 'Warning' | 'Other'>('Strategy');
  const [cv, setCv] = useState<Omit<Contract, 'id'>>({ club: '', league: '', startSeason: '', endSeason: '', apps: 0, goals: 0, assists: 0, avgRating: 0, trophies: [], notes: '' });

  const statusColor: Record<string, string> = { Pending: '#f59e0b', Accepted: '#22c55e', Rejected: '#ef4444', Expired: '#9aa7bd' };

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'linear-gradient(180deg,rgba(16,24,42,0.92),rgba(15,23,41,0.92))', border: '1px solid rgba(34,48,74,0.75)', borderRadius: '16px', padding: '18px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="Transfers & Contracts" subtitle="Offers inbox, decision helper, contract history" icon={<ArrowLeftRight size={18} />}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="green" size="sm" icon={<PlusCircle size={13} />} onClick={() => setOfferForm(true)}>Add Offer</Button>
            <Button variant="ghost" size="sm" onClick={() => setContractForm(true)}>Log Contract</Button>
            <Button variant="ghost" size="sm" onClick={() => setNoteForm(true)}>Agent Note</Button>
          </div>
        }
      />

      <Tabs tabs={[{ id: 'offers', label: 'Offers Inbox' }, { id: 'contracts', label: 'Contract History' }, { id: 'agent', label: 'Agent Strategy' }]}>
        {(tab) => (
          <>
            {tab === 'offers' && card(<>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Transfer Offers</div>
              {offers.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No offers received yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {offers.map((o) => (
                    <div key={o.id} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(34,48,74,0.6)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>{o.club}</span>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{o.league} · {o.country}</span>
                          {o.hasUCL && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', color: '#a78bfa' }}>UCL</span>}
                          <span style={{ fontSize: '11px', color: statusColor[o.status] }}>{o.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                          <span>Role: <strong style={{ color: 'var(--text)' }}>{o.role}</strong></span>
                          <span>Wage: <strong>{o.wage}</strong></span>
                          <span>Fee: <strong>{o.fee}</strong></span>
                          <span>Score: <strong style={{ color: '#f59e0b' }}>{o.score ?? scoreOffer(o)}/100</strong></span>
                        </div>
                        {o.notes && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>{o.notes}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <Button size="sm" variant="green" onClick={() => { updateOffer(o.id, { status: 'Accepted' }); toast('Offer accepted ✅', 'success'); }}>Accept</Button>
                        <Button size="sm" variant="danger" onClick={() => { updateOffer(o.id, { status: 'Rejected' }); }}>Reject</Button>
                        <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteOffer(o.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>)}

            {tab === 'contracts' && card(<>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Contract History</div>
              {contracts.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No contracts logged yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ color: 'var(--muted)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Club</th><th>League</th><th>Seasons</th><th>Apps</th><th>G</th><th>A</th><th>Avg ★</th><th />
                  </tr></thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id} style={{ borderTop: '1px solid rgba(34,48,74,0.4)' }}>
                        <td style={{ padding: '7px 8px', fontWeight: 600 }}>{c.club}</td>
                        <td style={{ textAlign: 'center' }}>{c.league}</td>
                        <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{c.startSeason}–{c.endSeason}</td>
                        <td style={{ textAlign: 'center' }}>{c.apps}</td>
                        <td style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{c.goals}</td>
                        <td style={{ textAlign: 'center', color: '#7c5cff', fontWeight: 700 }}>{c.assists}</td>
                        <td style={{ textAlign: 'center', color: '#f59e0b' }}>{c.avgRating.toFixed(1)}</td>
                        <td><Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteContract(c.id)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>)}

            {tab === 'agent' && card(<>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Agent / Strategy Notes</div>
              {agentNotes.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No agent notes yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {agentNotes.map((n) => (
                    <div key={n.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(34,48,74,0.5)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{fmtDate(n.date)} · {n.tag}</div>
                        <div style={{ fontSize: '13px' }}>{n.content}</div>
                      </div>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={11} />} onClick={() => deleteAgentNote(n.id)} />
                    </div>
                  ))}
                </div>
              )}
            </>)}
          </>
        )}
      </Tabs>

      {/* Add Offer Modal */}
      <Modal open={offerForm} onClose={() => setOfferForm(false)} title="Add Transfer Offer" width="600px"
        actions={<>
          <Button variant="ghost" onClick={() => setOfferForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addOffer({ ...ov, score: scoreOffer(ov) }); setOfferForm(false); toast('Offer added ✅', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Club" value={ov.club} onChange={(e) => setOv((v) => ({ ...v, club: e.target.value }))} required />
            <Input label="League" value={ov.league} onChange={(e) => setOv((v) => ({ ...v, league: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <Input label="Country" value={ov.country} onChange={(e) => setOv((v) => ({ ...v, country: e.target.value }))} />
            <Select label="Role" value={ov.role} onChange={(e) => setOv((v) => ({ ...v, role: e.target.value as TransferOffer['role'] }))} options={['Crucial','Important','Rotation','Bench'].map((r) => ({ value: r, label: r }))} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: 'var(--muted)' }}>
              UCL Access
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                <input type="checkbox" checked={ov.hasUCL} onChange={(e) => setOv((v) => ({ ...v, hasUCL: e.target.checked }))} /> Has UCL
              </label>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Wage" value={ov.wage} onChange={(e) => setOv((v) => ({ ...v, wage: e.target.value }))} placeholder="£45k/w" />
            <Input label="Fee" value={ov.fee} onChange={(e) => setOv((v) => ({ ...v, fee: e.target.value }))} placeholder="€12M" />
          </div>
          <Textarea label="Notes" value={ov.notes} onChange={(e) => setOv((v) => ({ ...v, notes: e.target.value }))} />
        </div>
      </Modal>

      {/* Agent note modal */}
      <Modal open={noteForm} onClose={() => setNoteForm(false)} title="Add Agent Note" width="480px"
        actions={<>
          <Button variant="ghost" onClick={() => setNoteForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addAgentNote({ date: todayISO(), content: noteContent, tag: noteTag }); setNoteForm(false); toast('Note added', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Select label="Tag" value={noteTag} onChange={(e) => setNoteTag(e.target.value as typeof noteTag)} options={['Strategy','Rumor','Goal','Warning','Other'].map((t) => ({ value: t, label: t }))} />
          <Textarea label="Note" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Don't leave Ajax before 85 OVR + UCL KO…" />
        </div>
      </Modal>

      {/* Contract form modal */}
      <Modal open={contractForm} onClose={() => setContractForm(false)} title="Log Contract" width="560px"
        actions={<>
          <Button variant="ghost" onClick={() => setContractForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addContract(cv); setContractForm(false); toast('Contract logged ✅', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Club" value={cv.club} onChange={(e) => setCv((v) => ({ ...v, club: e.target.value }))} />
            <Input label="League" value={cv.league} onChange={(e) => setCv((v) => ({ ...v, league: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Start Season" value={cv.startSeason} onChange={(e) => setCv((v) => ({ ...v, startSeason: e.target.value }))} placeholder="2025/26" />
            <Input label="End Season" value={cv.endSeason} onChange={(e) => setCv((v) => ({ ...v, endSeason: e.target.value }))} placeholder="2027/28" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <Input label="Apps" type="number" value={cv.apps} onChange={(e) => setCv((v) => ({ ...v, apps: Number(e.target.value) }))} />
            <Input label="Goals" type="number" value={cv.goals} onChange={(e) => setCv((v) => ({ ...v, goals: Number(e.target.value) }))} />
            <Input label="Assists" type="number" value={cv.assists} onChange={(e) => setCv((v) => ({ ...v, assists: Number(e.target.value) }))} />
            <Input label="Avg Rating" type="number" step="0.1" value={cv.avgRating} onChange={(e) => setCv((v) => ({ ...v, avgRating: Number(e.target.value) }))} />
          </div>
          <Textarea label="Notes" value={cv.notes} onChange={(e) => setCv((v) => ({ ...v, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
};
