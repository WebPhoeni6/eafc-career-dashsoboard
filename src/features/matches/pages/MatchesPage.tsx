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
  const { matches, filter, setFilter, resetFilter, updateMatch, deleteMatch, togglePin } = useMatchesStore();
  const toast = useToast((s) => s.show);
  const context = useOutletContext<{ openNewMatch: () => void } | null>();

  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = getFilteredMatches(matches, filter);

  const handleEdit = (m: Match) => setEditMatch(m);

  const handleEditSubmit = (values: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editMatch) return;
    updateMatch(editMatch.id, values);
    setEditMatch(null);
    toast('Match updated ✅', 'success');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMatch(deleteId);
    setDeleteId(null);
    toast('Match deleted 🗑️', 'default');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Match Log"
        subtitle={`${matches.length} matches logged • ${filtered.length} shown`}
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
        onPin={togglePin}
      />

      {/* Edit Modal */}
      <Modal open={!!editMatch} onClose={() => setEditMatch(null)} title="Edit Match" width="900px">
        {editMatch && (
          <MatchForm
            initial={editMatch}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditMatch(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Match"
        message="Are you sure you want to delete this match? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
