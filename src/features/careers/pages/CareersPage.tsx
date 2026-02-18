import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { CareerProfileForm } from '../../../components/forms/CareerProfileForm/CareerProfileForm';
import type { CareerProfile } from '../../../types/career.types';
import { useCareerStore } from '../../../store/career.store';
import * as careersApi from '../../../services/api/careers.api';
import { hydrateActiveCareerModules, hydrateCareerModules } from '../../../services/api/hydrate';
import { useToast } from '../../../hooks/useToast';
import { fmtDate } from '../../../utils/date';
import { FolderOpen, PlusCircle, Trash2 } from 'lucide-react';

export const CareersPage: React.FC = () => {
  const careers = useCareerStore((s) => s.careers);
  const activeCareerId = useCareerStore((s) => s.activeCareerId);
  const loadCareers = useCareerStore((s) => s.loadCareers);
  const activateCareer = useCareerStore((s) => s.activateCareer);
  const toast = useToast((s) => s.show);

  const [createOpen, setCreateOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [makeActive, setMakeActive] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [busyCareerId, setBusyCareerId] = useState<string | null>(null);

  useEffect(() => {
    void loadCareers();
  }, [loadCareers]);

  const openCreate = () => {
    setSaveName('');
    setMakeActive(true);
    setFormKey((n) => n + 1);
    setCreateOpen(true);
  };

  const handleCreate = async (profile: CareerProfile) => {
    const name = saveName.trim();
    if (!name) {
      toast('Save name is required', 'error');
      return;
    }

    try {
      setCreating(true);
      const created = await careersApi.createCareer({
        ...profile,
        saveName: name,
        isActive: makeActive,
      });
      await loadCareers();

      if (created.isActive || makeActive) await hydrateCareerModules(created.id);
      else await hydrateActiveCareerModules();

      setCreateOpen(false);
      toast('Career created', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create career', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setBusyCareerId(id);
      await activateCareer(id);
      await hydrateCareerModules(id);
      toast('Career activated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to activate career', 'error');
    } finally {
      setBusyCareerId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this career and all linked data?')) return;
    try {
      setBusyCareerId(id);
      await careersApi.deleteCareer(id);
      await loadCareers();
      await hydrateActiveCareerModules();
      toast('Career deleted', 'default');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete career', 'error');
    } finally {
      setBusyCareerId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Careers"
        subtitle="Manage all career saves, switch active career, and create new ones"
        icon={<FolderOpen size={18} />}
        actions={
          <Button variant="green" icon={<PlusCircle size={14} />} onClick={openCreate}>
            New Career
          </Button>
        }
      />

      {careers.length === 0 ? (
        <div
          style={{
            border: '1px solid var(--border)',
            background: 'var(--card-gradient)',
            borderRadius: '16px',
            padding: '20px',
            color: 'var(--muted)',
            fontSize: '13px',
          }}
        >
          No careers found yet. Create your first career save.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {careers.map((career) => {
            const isActive = career.id === activeCareerId;
            const isBusy = busyCareerId === career.id;

            return (
              <div
                key={career.id}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--card-gradient)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{career.saveName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {career.playerName} - {career.club} ({career.season})
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      border: `1px solid ${isActive ? 'rgba(34,197,94,0.35)' : 'var(--border-muted)'}`,
                      background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#22c55e' : 'var(--muted)',
                      fontWeight: 700,
                    }}
                  >
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  Updated: {fmtDate(career.updatedAt)}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button
                    size="sm"
                    variant={isActive ? 'accent' : 'ghost'}
                    disabled={isActive || isBusy}
                    onClick={() => {
                      void handleActivate(career.id);
                    }}
                  >
                    {isBusy ? 'Please wait...' : isActive ? 'Active' : 'Set Active'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={12} />}
                    disabled={isBusy}
                    onClick={() => {
                      void handleDelete(career.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Career" width="900px">
        <div style={{ display: 'grid', gap: '12px', marginBottom: '10px' }}>
          <Input
            label="Save Name"
            placeholder="My Main Career Save"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
            <input
              type="checkbox"
              checked={makeActive}
              onChange={(e) => setMakeActive(e.target.checked)}
              disabled={creating}
            />
            Make this career active immediately
          </label>
        </div>

        <CareerProfileForm
          key={formKey}
          onSave={(profile) => {
            void handleCreate(profile);
          }}
        />
      </Modal>
    </div>
  );
};

