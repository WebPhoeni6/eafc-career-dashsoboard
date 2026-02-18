import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMatchesStore } from '../../../store/matches.store';
import { getFilteredMatches } from '../selectors';
import { MatchFilters } from '../components/MatchFilters';
import { MatchTable } from '../components/MatchTable';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Modal } from '../../../components/ui/Modal';
import { MatchForm } from '../../../components/forms/MatchForm/MatchForm';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { Swords, PlusCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import type { Match } from '../../../types/match.types';

export const MatchesPage: React.FC = () => {
  const { matches, filter, setFilter, resetFilter, updateMatch, deleteMatch, togglePin, uploadPerformanceImage, deletePerformanceImage } = useMatchesStore();
  const toast = useToast((s) => s.show);
  const context = useOutletContext<{ openNewMatch: () => void } | null>();

  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = getFilteredMatches(matches, filter);

  const handleEdit = (m: Match) => setEditMatch(m);

  const handleEditSubmit = async (values: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editMatch) return;
    try {
      await updateMatch(editMatch.id, values);
      setEditMatch(null);
      toast('Match updated', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update match', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMatch(deleteId);
      setDeleteId(null);
      toast('Match deleted', 'default');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete match', 'error');
    }
  };

  const handlePin = async (id: string) => {
    try {
      await togglePin(id);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to pin match', 'error');
    }
  };

  const handleUploadImage = async (id: string, file: File) => {
    try {
      await uploadPerformanceImage(id, file);
      toast('Image uploaded', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to upload image', 'error');
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await deletePerformanceImage(id);
      toast('Image removed', 'default');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove image', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Match Log"
        subtitle={`${matches.length} matches logged - ${filtered.length} shown`}
        icon={<Swords size={18} />}
        actions={
          <Button variant="green" icon={<PlusCircle size={15} />} onClick={() => context?.openNewMatch()}>
            Add Match
          </Button>
        }
      />

      <MatchFilters
        filter={filter}
        onChange={setFilter as (f: Partial<{ search: string; competition: string; position: string; dateFrom: string; dateTo: string; pinnedOnly: boolean }>) => void}
        onReset={resetFilter}
      />

      <MatchTable
        matches={filtered}
        allMatchesCount={matches.length}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteId(id)}
        onPin={(id) => { void handlePin(id); }}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
      />

      <Modal open={!!editMatch} onClose={() => setEditMatch(null)} title="Edit Match" width="900px">
        {editMatch && (
          <MatchForm
            initial={editMatch}
            onSubmit={(values) => { void handleEditSubmit(values); }}
            onCancel={() => setEditMatch(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Match"
        message="Are you sure you want to delete this match? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { void handleDelete(); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
