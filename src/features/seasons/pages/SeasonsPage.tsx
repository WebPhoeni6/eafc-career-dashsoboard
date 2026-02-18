import React, { useState } from 'react';
import { useMatchesStore } from '../../../store/matches.store';
import { useSeasonsStore } from '../../../store/seasons.store';
import { useCareerStore } from '../../../store/career.store';
import { computeKPIs } from '../../../services/analytics/kpis';
import { getDashboardData } from '../../dashboard/selectors';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { CalendarDays, PlusCircle, Trophy, Target, Tag } from 'lucide-react';
import { fmtRating } from '../../../utils/format';
import { useToast } from '../../../hooks/useToast';

export const SeasonsPage: React.FC = () => {
  const matches = useMatchesStore((s) => s.matches);
  const { trophies, challenges, narrativeTags, addTrophy, deleteTrophy, addChallenge, deleteChallenge, addNarrativeTag, deleteNarrativeTag } = useSeasonsStore();
  const { career } = useCareerStore();
  const toast = useToast((s) => s.show);
  const [trophyForm, setTrophyForm] = useState(false);
  const [challengeForm, setChallengeForm] = useState(false);
  const [tagForm, setTagForm] = useState(false);
  const [trophyName, setTrophyName] = useState('');
  const [trophyComp, setTrophyComp] = useState('');
  const [challengeLabel, setChallengeLabel] = useState('');
  const [challengeTarget, setChallengeTarget] = useState(10);
  const [challengeUnit, setChallengeUnit] = useState('goals');
  const [tagText, setTagText] = useState('');

  const { milestones } = getDashboardData(matches, career);

  // Group by season
  const seasonMap = new Map<string, typeof matches>();
  for (const m of matches) {
    const arr = seasonMap.get(m.competition) ?? [];
    arr.push(m);
    seasonMap.set(m.competition, arr);
  }

  const seasonGroups = new Map<string, typeof matches>();
  for (const m of matches) {
    // Group by career season or by year
    const key = career?.season ?? m.matchDate?.slice(0, 4) ?? 'Unknown';
    const arr = seasonGroups.get(key) ?? [];
    arr.push(m);
    seasonGroups.set(key, arr);
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background: 'var(--card-gradient)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <PageHeader title="Seasons" subtitle="Season summaries, milestones & trophies" icon={<CalendarDays size={18} />}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="green" size="sm" icon={<PlusCircle size={13} />} onClick={() => setTrophyForm(true)}>Add Trophy</Button>
            <Button variant="ghost" size="sm" icon={<Target size={13} />} onClick={() => setChallengeForm(true)}>Add Challenge</Button>
            <Button variant="ghost" size="sm" icon={<Tag size={13} />} onClick={() => setTagForm(true)}>Add Tag</Button>
          </div>
        }
      />

      {/* Season summaries */}
      {Array.from(seasonGroups.entries()).map(([season, ms]) => {
        const kpis = computeKPIs(ms);
        const best = ms.reduce((b, m) => m.matchRating > b.matchRating ? m : b, ms[0]);
        const worst = ms.reduce((b, m) => m.matchRating < b.matchRating ? m : b, ms[0]);
        return card(
          <div key={season}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>📅 {season}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '12px' }}>
              {[
                { label: 'Apps', value: kpis.apps },
                { label: 'Goals', value: kpis.goals, color: '#22c55e' },
                { label: 'Assists', value: kpis.assists, color: '#7c5cff' },
                { label: 'Avg ★', value: fmtRating(kpis.avgRating), color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.045)', border: '1px solid var(--border-muted)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: color ?? 'var(--text)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '16px' }}>
              <span>Best: <strong style={{ color: '#22c55e' }}>{best?.opponent} {fmtRating(best?.matchRating ?? 0)}★</strong></span>
              <span>Worst: <strong style={{ color: '#ef4444' }}>{worst?.opponent} {fmtRating(worst?.matchRating ?? 0)}★</strong></span>
              <span>W/D/L: <strong>{kpis.wins}/{kpis.draws}/{kpis.losses}</strong></span>
            </div>
          </div>
        );
      })}

      {/* Milestones */}
      {card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trophy size={16} style={{ color: '#f59e0b' }} /> Milestones
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '10px' }}>
          {milestones.map((m) => {
            const pct = Math.min(100, (m.current / m.target) * 100);
            return (
              <div key={m.key} style={{ padding: '12px', borderRadius: '12px', background: m.reached ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.reached ? 'rgba(34,197,94,0.3)' : 'rgba(34,48,74,0.5)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.label}</span>
                  {m.reached && '✅'}
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: m.reached ? '#22c55e' : '#7c5cff', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{m.current}/{m.target}</div>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Challenges */}
      {challenges.length > 0 && card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>🎯 Season Challenges</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {challenges.map((c) => {
            const pct = Math.min(100, (c.current / c.target) * 100);
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{c.label} ({c.current}/{c.target} {c.unit})</div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c.completed ? '#22c55e' : '#7c5cff', borderRadius: '3px' }} />
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteChallenge(c.id)}>✕</Button>
              </div>
            );
          })}
        </div>
      </>)}

      {/* Trophies */}
      {trophies.length > 0 && card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>🏆 Trophy Cabinet ({trophies.length})</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {trophies.map((t) => (
            <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '12px' }}>
              🏆 {t.name} ({t.season})
              <button onClick={() => deleteTrophy(t.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
            </span>
          ))}
        </div>
      </>)}

      {/* Narrative tags */}
      {narrativeTags.length > 0 && card(<>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>📖 Story Tags</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {narrativeTags.map((t) => (
            <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.3)', fontSize: '12px' }}>
              {t.tag}
              <button onClick={() => deleteNarrativeTag(t.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
            </span>
          ))}
        </div>
      </>)}

      {/* Modals */}
      <Modal open={trophyForm} onClose={() => setTrophyForm(false)} title="Add Trophy" width="420px"
        actions={<>
          <Button variant="ghost" onClick={() => setTrophyForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addTrophy({ name: trophyName, competition: trophyComp, season: career?.season ?? '', date: new Date().toISOString().slice(0,10) }); setTrophyForm(false); toast('Trophy added 🏆', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Trophy Name" value={trophyName} onChange={(e) => setTrophyName(e.target.value)} placeholder="Eredivisie Title" />
          <Input label="Competition" value={trophyComp} onChange={(e) => setTrophyComp(e.target.value)} placeholder="League" />
        </div>
      </Modal>

      <Modal open={challengeForm} onClose={() => setChallengeForm(false)} title="Add Season Challenge" width="420px"
        actions={<>
          <Button variant="ghost" onClick={() => setChallengeForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addChallenge({ season: career?.season ?? '', label: challengeLabel, target: challengeTarget, current: 0, unit: challengeUnit, completed: false }); setChallengeForm(false); toast('Challenge added 🎯', 'success'); }}>Add</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Input label="Challenge" value={challengeLabel} onChange={(e) => setChallengeLabel(e.target.value)} placeholder="Score 20 league goals" />
          <Input label="Target" type="number" value={challengeTarget} onChange={(e) => setChallengeTarget(Number(e.target.value))} />
          <Input label="Unit" value={challengeUnit} onChange={(e) => setChallengeUnit(e.target.value)} placeholder="goals" />
        </div>
      </Modal>

      <Modal open={tagForm} onClose={() => setTagForm(false)} title="Add Story Tag" width="420px"
        actions={<>
          <Button variant="ghost" onClick={() => setTagForm(false)}>Cancel</Button>
          <Button variant="green" onClick={() => { addNarrativeTag({ season: career?.season ?? '', tag: tagText }); setTagForm(false); toast('Tag added 📖', 'success'); }}>Add</Button>
        </>}>
        <Input label="Tag" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Breakout season" />
      </Modal>
    </div>
  );
};

