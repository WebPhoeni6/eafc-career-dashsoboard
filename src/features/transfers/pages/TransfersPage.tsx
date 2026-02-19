import React, { useEffect, useMemo, useState } from 'react';
import { useTransfersStore } from '../../../store/transfers.store';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Tabs } from '../../../components/ui/Tabs';
import { Archive, ArrowLeftRight, Check, PlusCircle, RotateCcw, Trash2, X } from 'lucide-react';
import { fmtDate, todayISO } from '../../../utils/date';
import { useToast } from '../../../hooks/useToast';
import type { TransferOffer, Contract } from '../../../types/transfer.types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import {
  OFFER_ROLE_OPTIONS,
  OFFER_STATUS_OPTIONS,
  validateContractCloseInput,
  validateContractStartInput,
  validateOfferInput,
} from '../validation';

function scoreOffer(o: Partial<TransferOffer>): number {
  let score = 0;
  if (o.role === 'Crucial') score += 35;
  else if (o.role === 'Important') score += 25;
  else if (o.role === 'Rotation') score += 10;

  if (o.hasUCL) score += 25;

  const leagueScores: Record<string, number> = {
    'Premier League': 20,
    'La Liga': 18,
    Bundesliga: 16,
    'Serie A': 15,
    'Ligue 1': 12,
    Eredivisie: 10,
  };

  score += leagueScores[o.league ?? ''] ?? 5;
  return Math.min(100, score);
}

const defaultOffer = (): Omit<TransferOffer, 'id' | 'createdAt'> => ({
  club: '',
  league: '',
  country: '',
  role: 'Important',
  wage: '',
  fee: '',
  hasUCL: false,
  status: 'Pending',
  receivedDate: todayISO(),
  notes: '',
  score: 0,
});

function parseOfferNotes(notes: string): {
  contractObjectives: string;
  wageObjectives: string;
  extraNotes: string;
} {
  const lines = String(notes || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const findValue = (prefix: string): string => {
    const line = lines.find((item) => item.toLowerCase().startsWith(prefix.toLowerCase()));
    return line ? line.slice(prefix.length).trim() : '';
  };

  return {
    contractObjectives: findValue('Contract objectives:'),
    wageObjectives: findValue('Wage objectives:'),
    extraNotes: findValue('Notes:'),
  };
}

export const TransfersPage: React.FC = () => {
  const {
    offers,
    contracts,
    agentNotes,
    addOffer,
    updateOffer,
    deleteOffer,
    addContract,
    updateContract,
    deleteContract,
    addAgentNote,
    deleteAgentNote,
  } = useTransfersStore();

  const toast = useToast((s) => s.show);

  const [offerForm, setOfferForm] = useState(false);
  const [noteForm, setNoteForm] = useState(false);
  const [contractForm, setContractForm] = useState(false);
  const [closeContractForm, setCloseContractForm] = useState(false);
  const [offerStatusFilter, setOfferStatusFilter] = useState<'ALL' | TransferOffer['status']>('ALL');
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [compactOfferActions, setCompactOfferActions] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 760 : false,
  );
  const [closingContract, setClosingContract] = useState<Contract | null>(null);

  const [ov, setOv] = useLocalStorage<Omit<TransferOffer, 'id' | 'createdAt'>>(
    'transfers.offer.draft.v1',
    defaultOffer(),
  );
  const [offerDraftNotes, setOfferDraftNotes] = useLocalStorage<{
    contractObjectives: string;
    wageObjectives: string;
    offerNotes: string;
  }>('transfers.offer.notes.draft.v1', {
    contractObjectives: '',
    wageObjectives: '',
    offerNotes: '',
  });

  const [noteContent, setNoteContent] = useState('');
  const [noteTag, setNoteTag] = useState<'Strategy' | 'Rumor' | 'Goal' | 'Warning' | 'Other'>('Strategy');

  const [cv, setCv] = useLocalStorage<{
    club: string;
    league: string;
    startSeason: string;
    notes: string;
  }>('transfers.contract.start.draft.v1', {
    club: '',
    league: '',
    startSeason: '',
    notes: '',
  });

  const [closeCv, setCloseCv] = useLocalStorage<{
    endSeason: string;
    apps: number;
    goals: number;
    assists: number;
    avgRating: number;
    notes: string;
  }>('transfers.contract.close.draft.v1', {
    endSeason: '',
    apps: 0,
    goals: 0,
    assists: 0,
    avgRating: 0,
    notes: '',
  });

  const activeContract = useMemo(() => contracts.find((c) => c.endSeason === 'Active') ?? null, [contracts]);
  const filteredOffers = useMemo(
    () => offers.filter((o) => offerStatusFilter === 'ALL' || o.status === offerStatusFilter),
    [offers, offerStatusFilter],
  );
  const selectedOffers = useMemo(
    () => offers.filter((o) => selectedOfferIds.includes(o.id)),
    [offers, selectedOfferIds],
  );

  const statusColor: Record<string, string> = {
    Pending: '#f59e0b',
    Accepted: '#22c55e',
    Rejected: '#ef4444',
    Expired: '#9aa7bd',
  };

  const card = (children: React.ReactNode) => (
    <div
      style={{
        background: 'var(--card-gradient)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '18px',
      }}
    >
      {children}
    </div>
  );

  useEffect(() => {
    const onResize = () => setCompactOfferActions(window.innerWidth <= 760);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setSelectedOfferIds((prev) => prev.filter((id) => offers.some((offer) => offer.id === id)));
  }, [offers]);

  const setContractObjectives = (value: string) => {
    setOfferDraftNotes((prev) => ({ ...prev, contractObjectives: value }));
  };

  const setWageObjectives = (value: string) => {
    setOfferDraftNotes((prev) => ({ ...prev, wageObjectives: value }));
  };

  const setOfferNotes = (value: string) => {
    setOfferDraftNotes((prev) => ({ ...prev, offerNotes: value }));
  };

  const clearOfferDraft = () => {
    setOv(defaultOffer());
    setOfferDraftNotes({
      contractObjectives: '',
      wageObjectives: '',
      offerNotes: '',
    });
  };

  const clearContractStartDraft = () => {
    setCv({
      club: '',
      league: '',
      startSeason: '',
      notes: '',
    });
  };

  const clearContractCloseDraft = () => {
    setCloseCv({
      endSeason: '',
      apps: 0,
      goals: 0,
      assists: 0,
      avgRating: 0,
      notes: '',
    });
  };

  const openCloseContractModal = (contract: Contract) => {
    setClosingContract(contract);
    setCloseCv({
      endSeason: contract.endSeason === 'Active' ? '' : contract.endSeason,
      apps: contract.apps,
      goals: contract.goals,
      assists: contract.assists,
      avgRating: contract.avgRating,
      notes: contract.notes,
    });
    setCloseContractForm(true);
  };

  const isOfferSelected = (id: string) => selectedOfferIds.includes(id);

  const toggleOfferSelected = (id: string) => {
    setSelectedOfferIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredOffers.map((o) => o.id);
    const allVisibleSelected = visibleIds.every((id) => selectedOfferIds.includes(id));
    if (allVisibleSelected) {
      setSelectedOfferIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedOfferIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const updateOfferStatus = async (offerId: string, status: TransferOffer['status']) => {
    const payload: Partial<TransferOffer> = {
      status,
      decisionDate: status === 'Pending' ? '' : todayISO(),
    };
    await updateOffer(offerId, payload);
  };

  const handleBulkArchive = async () => {
    const targets = selectedOffers.filter((o) => o.status !== 'Expired');
    if (!targets.length) {
      toast('No selected offers to archive', 'default');
      return;
    }
    try {
      await Promise.all(targets.map((o) => updateOfferStatus(o.id, 'Expired')));
      toast(`Archived ${targets.length} offer${targets.length > 1 ? 's' : ''}`, 'success');
      setSelectedOfferIds([]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to archive selected offers', 'error');
    }
  };

  const handleBulkReopen = async () => {
    const targets = selectedOffers.filter((o) => o.status !== 'Pending');
    if (!targets.length) {
      toast('No selected offers to reopen', 'default');
      return;
    }
    try {
      await Promise.all(targets.map((o) => updateOfferStatus(o.id, 'Pending')));
      toast(`Reopened ${targets.length} offer${targets.length > 1 ? 's' : ''}`, 'success');
      setSelectedOfferIds([]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to reopen selected offers', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedOffers.length) {
      toast('No selected offers to delete', 'default');
      return;
    }
    try {
      await Promise.all(selectedOffers.map((o) => deleteOffer(o.id)));
      toast(`Deleted ${selectedOffers.length} offer${selectedOffers.length > 1 ? 's' : ''}`, 'default');
      setSelectedOfferIds([]);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete selected offers', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader
        title="Transfers & Contracts"
        subtitle="Offers inbox, decision helper, contract history"
        icon={<ArrowLeftRight size={18} />}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="green" size="sm" icon={<PlusCircle size={13} />} onClick={() => setOfferForm(true)}>
              Add Offer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (activeContract) {
                  toast('Close your active contract before logging a new one', 'error');
                  return;
                }
                setContractForm(true);
              }}
              disabled={!!activeContract}
              title={activeContract ? `Active contract at ${activeContract.club}` : 'Log a new contract'}
            >
              Log Contract
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setNoteForm(true)}>
              Agent Note
            </Button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: 'offers', label: 'Offers Inbox' },
          { id: 'contracts', label: 'Contract History' },
          { id: 'agent', label: 'Agent Strategy' },
        ]}
      >
        {(tab) => (
          <>
            {tab === 'offers' &&
              card(
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Transfer Offers</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: '170px' }}>
                        <Select
                          value={offerStatusFilter}
                          onChange={(e) => setOfferStatusFilter(e.target.value as 'ALL' | TransferOffer['status'])}
                          options={[
                            { value: 'ALL', label: 'All statuses' },
                            ...OFFER_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
                          ]}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleSelectAllVisible}
                        disabled={filteredOffers.length === 0}
                      >
                        {filteredOffers.length > 0 && filteredOffers.every((offer) => isOfferSelected(offer.id))
                          ? 'Unselect visible'
                          : 'Select visible'}
                      </Button>
                    </div>
                  </div>

                  {selectedOffers.length > 0 && (
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-muted)',
                        background: 'rgba(255,255,255,0.03)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {selectedOffers.length} selected
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="ghost" icon={<Archive size={12} />} onClick={() => { void handleBulkArchive(); }}>
                          Archive
                        </Button>
                        <Button size="sm" variant="ghost" icon={<RotateCcw size={12} />} onClick={() => { void handleBulkReopen(); }}>
                          Reopen
                        </Button>
                        <Button size="sm" variant="danger" icon={<Trash2 size={12} />} onClick={() => { void handleBulkDelete(); }}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}

                  {filteredOffers.length === 0 ? (
                    <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                      {offers.length === 0 ? 'No offers received yet.' : 'No offers match this filter.'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredOffers.map((o) => {
                        const parsed = parseOfferNotes(o.notes);
                        return (
                          <div
                            key={o.id}
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border-muted)',
                              display: 'flex',
                              gap: '16px',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ paddingTop: '2px' }}>
                              <input
                                type="checkbox"
                                checked={isOfferSelected(o.id)}
                                onChange={() => toggleOfferSelected(o.id)}
                                aria-label={`Select offer from ${o.club}`}
                              />
                            </div>
                            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '14px' }}>{o.club}</span>
                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  {o.league} - {o.country}
                                </span>
                                {o.hasUCL && (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      background: 'rgba(124,92,255,0.15)',
                                      border: '1px solid rgba(124,92,255,0.3)',
                                      color: '#a78bfa',
                                    }}
                                  >
                                    UCL
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', color: statusColor[o.status] }}>{o.status}</span>
                              </div>

                              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)', flexWrap: 'wrap' }}>
                                <span>
                                  Role: <strong style={{ color: 'var(--text)' }}>{o.role}</strong>
                                </span>
                                <span>
                                  Requested Wage: <strong>{o.wage}</strong>
                                </span>
                                <span>
                                  Current Wage: <strong>{o.fee}</strong>
                                </span>
                                <span>
                                  Score: <strong style={{ color: '#f59e0b' }}>{o.score ?? scoreOffer(o)}/100</strong>
                                </span>
                              </div>

                              {parsed.contractObjectives && (
                                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                                  Contract objectives: {parsed.contractObjectives}
                                </div>
                              )}
                              {parsed.wageObjectives && (
                                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                                  Wage objectives: {parsed.wageObjectives}
                                </div>
                              )}
                              {parsed.extraNotes && (
                                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                                  {parsed.extraNotes}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {o.status === 'Pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="green"
                                    onClick={async () => {
                                      try {
                                        await updateOfferStatus(o.id, 'Accepted');
                                        toast('Offer accepted', 'success');
                                      } catch (err) {
                                        toast(err instanceof Error ? err.message : 'Failed to update offer', 'error');
                                      }
                                    }}
                                    icon={compactOfferActions ? <Check size={12} /> : undefined}
                                    title="Accept offer"
                                  >
                                    {compactOfferActions ? '' : 'Accept'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={async () => {
                                      try {
                                        await updateOfferStatus(o.id, 'Rejected');
                                        toast('Offer rejected', 'default');
                                      } catch (err) {
                                        toast(err instanceof Error ? err.message : 'Failed to update offer', 'error');
                                      }
                                    }}
                                    icon={compactOfferActions ? <X size={12} /> : undefined}
                                    title="Reject offer"
                                  >
                                    {compactOfferActions ? '' : 'Reject'}
                                  </Button>
                                </>
                              )}
                              {o.status !== 'Pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    try {
                                      await updateOfferStatus(o.id, 'Pending');
                                      toast('Offer reopened', 'success');
                                    } catch (err) {
                                      toast(err instanceof Error ? err.message : 'Failed to update offer', 'error');
                                    }
                                  }}
                                  icon={compactOfferActions ? <RotateCcw size={12} /> : undefined}
                                  title="Reopen offer"
                                >
                                  {compactOfferActions ? '' : 'Reopen'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Trash2 size={11} />}
                                onClick={async () => {
                                  try {
                                    await deleteOffer(o.id);
                                  } catch (err) {
                                    toast(err instanceof Error ? err.message : 'Failed to delete offer', 'error');
                                  }
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>,
              )}

            {tab === 'contracts' &&
              card(
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Contract History</div>
                    {activeContract ? (
                      <div style={{ fontSize: '12px', color: '#22c55e' }}>
                        Active contract: <strong>{activeContract.club}</strong> ({activeContract.startSeason} - Present)
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        No active contract. You can log a new one.
                      </div>
                    )}
                  </div>
                  {contracts.length === 0 ? (
                    <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                      No contracts logged yet.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ color: 'var(--muted)' }}>
                          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Club</th>
                          <th>League</th>
                          <th>Seasons</th>
                          <th>Apps</th>
                          <th>G</th>
                          <th>A</th>
                          <th>Avg *</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.map((c) => (
                          <tr key={c.id} style={{ borderTop: '1px solid var(--border-muted)' }}>
                            <td style={{ padding: '7px 8px', fontWeight: 600 }}>
                              {c.club}
                              {c.endSeason === 'Active' && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', borderRadius: '999px', padding: '1px 6px' }}>
                                  ACTIVE
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>{c.league}</td>
                            <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                              {c.endSeason === 'Active' ? `${c.startSeason} - Present` : `${c.startSeason}-${c.endSeason}`}
                            </td>
                            <td style={{ textAlign: 'center' }}>{c.apps}</td>
                            <td style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{c.goals}</td>
                            <td style={{ textAlign: 'center', color: '#7c5cff', fontWeight: 700 }}>{c.assists}</td>
                            <td style={{ textAlign: 'center', color: '#f59e0b' }}>{c.avgRating.toFixed(1)}</td>
                            <td style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {c.endSeason === 'Active' && (
                                <Button
                                  size="sm"
                                  variant="green"
                                  onClick={() => openCloseContractModal(c)}
                                >
                                  Close
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Trash2 size={11} />}
                                onClick={() => deleteContract(c.id)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>,
              )}

            {tab === 'agent' &&
              card(
                <>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Agent / Strategy Notes</div>
                  {agentNotes.length === 0 ? (
                    <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                      No agent notes yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {agentNotes.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-muted)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                              {fmtDate(n.date)} - {n.tag}
                            </div>
                            <div style={{ fontSize: '13px' }}>{n.content}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 size={11} />}
                            onClick={() => deleteAgentNote(n.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>,
              )}
          </>
        )}
      </Tabs>

      <Modal
        open={offerForm}
        onClose={() => setOfferForm(false)}
        title="Add Contract Offer"
        width="700px"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOfferForm(false)}>
              Cancel
            </Button>
            <Button
              variant="green"
              onClick={async () => {
                const payload = {
                  ...ov,
                  fee: ov.fee.trim() || 'N/A',
                };
                const validationError = validateOfferInput(payload);
                if (validationError) {
                  toast(validationError, 'error');
                  return;
                }

                const mergedNotes = [
                  offerDraftNotes.contractObjectives.trim() ? `Contract objectives: ${offerDraftNotes.contractObjectives.trim()}` : '',
                  offerDraftNotes.wageObjectives.trim() ? `Wage objectives: ${offerDraftNotes.wageObjectives.trim()}` : '',
                  offerDraftNotes.offerNotes.trim() ? `Notes: ${offerDraftNotes.offerNotes.trim()}` : '',
                ]
                  .filter(Boolean)
                  .join('\n');

                try {
                  await addOffer({
                    ...payload,
                    notes: mergedNotes,
                    score: scoreOffer(ov),
                  });
                  setOfferForm(false);
                  clearOfferDraft();
                  toast('Offer added', 'success');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Failed to add offer', 'error');
                }
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <Input
              label="Club"
              value={ov.club}
              onChange={(e) => setOv((v) => ({ ...v, club: e.target.value }))}
              required
            />
            <Input
              label="League"
              value={ov.league}
              onChange={(e) => setOv((v) => ({ ...v, league: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <Input
              label="Country"
              value={ov.country}
              onChange={(e) => setOv((v) => ({ ...v, country: e.target.value }))}
            />
            <Select
              label="Role"
              value={ov.role}
              onChange={(e) => setOv((v) => ({ ...v, role: e.target.value as TransferOffer['role'] }))}
              options={OFFER_ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
            />
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                fontSize: '12px',
                color: 'var(--muted)',
              }}
            >
              UCL Access
              <label
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginTop: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text)',
                }}
              >
                <input
                  type="checkbox"
                  checked={ov.hasUCL}
                  onChange={(e) => setOv((v) => ({ ...v, hasUCL: e.target.checked }))}
                />{' '}
                Has UCL
              </label>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <Input
              label="Requested Weekly Wage"
              value={ov.wage}
              onChange={(e) => setOv((v) => ({ ...v, wage: e.target.value }))}
              placeholder="$7,966"
            />
            <Input
              label="Current Wage (optional)"
              value={ov.fee}
              onChange={(e) => setOv((v) => ({ ...v, fee: e.target.value }))}
              placeholder="$10,620"
            />
          </div>

          <Textarea
            label="Contract Objectives"
            value={offerDraftNotes.contractObjectives}
            onChange={(e) => setContractObjectives(e.target.value)}
            placeholder="Reach mandatory objectives to be eligible for this contract."
          />
          <Textarea
            label="Wage Objectives"
            value={offerDraftNotes.wageObjectives}
            onChange={(e) => setWageObjectives(e.target.value)}
            placeholder="Reach optional wage objectives to receive your requested weekly wage."
          />
          <Textarea
            label="Additional Notes"
            value={offerDraftNotes.offerNotes}
            onChange={(e) => setOfferNotes(e.target.value)}
            placeholder="Any extra context about this offer."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="button" size="sm" variant="ghost" onClick={clearOfferDraft}>
              Discard Offer Draft
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={noteForm}
        onClose={() => setNoteForm(false)}
        title="Add Agent Note"
        width="480px"
        actions={
          <>
            <Button variant="ghost" onClick={() => setNoteForm(false)}>
              Cancel
            </Button>
            <Button
              variant="green"
              onClick={async () => {
                if (!noteContent.trim()) {
                  toast('Note content is required', 'error');
                  return;
                }
                try {
                  await addAgentNote({ date: todayISO(), content: noteContent.trim(), tag: noteTag });
                  setNoteForm(false);
                  setNoteContent('');
                  toast('Note added', 'success');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Failed to add note', 'error');
                }
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Select
            label="Tag"
            value={noteTag}
            onChange={(e) => setNoteTag(e.target.value as typeof noteTag)}
            options={['Strategy', 'Rumor', 'Goal', 'Warning', 'Other'].map((t) => ({
              value: t,
              label: t,
            }))}
          />
          <Textarea
            label="Note"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Do not leave before the role and form targets are met."
          />
        </div>
      </Modal>

      <Modal
        open={contractForm}
        onClose={() => setContractForm(false)}
        title="Log New Contract (Start)"
        width="560px"
        actions={
          <>
            <Button variant="ghost" onClick={() => setContractForm(false)}>
              Cancel
            </Button>
            <Button
              variant="green"
              onClick={async () => {
                if (activeContract) {
                  toast('Close your active contract before logging a new one', 'error');
                  return;
                }
                const validationError = validateContractStartInput(cv);
                if (validationError) {
                  toast(validationError, 'error');
                  return;
                }
                try {
                  await addContract({
                    club: cv.club.trim(),
                    league: cv.league.trim(),
                    startSeason: cv.startSeason.trim(),
                    notes: cv.notes.trim(),
                  });
                  setContractForm(false);
                  clearContractStartDraft();
                  toast('Contract logged', 'success');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Failed to log contract', 'error');
                }
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <Input label="Club" value={cv.club} onChange={(e) => setCv((v) => ({ ...v, club: e.target.value }))} />
            <Input
              label="League"
              value={cv.league}
              onChange={(e) => setCv((v) => ({ ...v, league: e.target.value }))}
            />
          </div>
          <Input
            label="Start Season"
            value={cv.startSeason}
            onChange={(e) => setCv((v) => ({ ...v, startSeason: e.target.value }))}
            placeholder="2025/26"
          />
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            End season and match stats are logged later with the <strong style={{ color: 'var(--text)' }}>Close</strong> action on this contract.
          </div>
          <Textarea label="Notes" value={cv.notes} onChange={(e) => setCv((v) => ({ ...v, notes: e.target.value }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="button" size="sm" variant="ghost" onClick={clearContractStartDraft}>
              Discard Contract Draft
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={closeContractForm}
        onClose={() => {
          setCloseContractForm(false);
          setClosingContract(null);
        }}
        title="Close Contract"
        width="560px"
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCloseContractForm(false);
                setClosingContract(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="green"
              onClick={async () => {
                if (!closingContract) return;
                const validationError = validateContractCloseInput(closeCv);
                if (validationError) {
                  toast(validationError, 'error');
                  return;
                }
                try {
                  await updateContract(closingContract.id, {
                    endSeason: closeCv.endSeason.trim(),
                    apps: closeCv.apps,
                    goals: closeCv.goals,
                    assists: closeCv.assists,
                    avgRating: closeCv.avgRating,
                    notes: closeCv.notes,
                  });
                  setCloseContractForm(false);
                  setClosingContract(null);
                  clearContractCloseDraft();
                  toast('Contract closed', 'success');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Failed to close contract', 'error');
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input
            label="End Season"
            value={closeCv.endSeason}
            onChange={(e) => setCloseCv((v) => ({ ...v, endSeason: e.target.value }))}
            placeholder="2027/28"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <Input
              label="Apps"
              type="number"
              value={closeCv.apps}
              onChange={(e) => setCloseCv((v) => ({ ...v, apps: Number(e.target.value) || 0 }))}
            />
            <Input
              label="Goals"
              type="number"
              value={closeCv.goals}
              onChange={(e) => setCloseCv((v) => ({ ...v, goals: Number(e.target.value) || 0 }))}
            />
            <Input
              label="Assists"
              type="number"
              value={closeCv.assists}
              onChange={(e) => setCloseCv((v) => ({ ...v, assists: Number(e.target.value) || 0 }))}
            />
            <Input
              label="Avg Rating"
              type="number"
              step="0.1"
              value={closeCv.avgRating}
              onChange={(e) => setCloseCv((v) => ({ ...v, avgRating: Number(e.target.value) || 0 }))}
            />
          </div>
          <Textarea label="Notes" value={closeCv.notes} onChange={(e) => setCloseCv((v) => ({ ...v, notes: e.target.value }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="button" size="sm" variant="ghost" onClick={clearContractCloseDraft}>
              Discard Close Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

