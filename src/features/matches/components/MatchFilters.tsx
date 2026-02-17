import React from 'react';
import { SearchBar } from '../../../components/shared/SearchBar';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { COMPETITIONS, POSITIONS } from '../../../utils/constants';
import { Pin } from 'lucide-react';

interface MatchFilter {
  search: string;
  competition: string;
  position: string;
  dateFrom: string;
  dateTo: string;
  pinnedOnly: boolean;
}

interface MatchFiltersProps {
  filter: MatchFilter;
  onChange: (f: Partial<MatchFilter>) => void;
  onReset: () => void;
}

export const MatchFilters: React.FC<MatchFiltersProps> = ({ filter, onChange, onReset }) => (
  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
    <div style={{ flex: '1 1 200px', minWidth: '160px' }}>
      <SearchBar id="match-search" value={filter.search} onChange={(v) => onChange({ search: v })} placeholder="Search opponent, notes…" />
    </div>
    <div style={{ flex: '1 1 130px' }}>
      <Select
        value={filter.competition}
        onChange={(e) => onChange({ competition: e.target.value })}
        options={[{ value: 'ALL', label: 'All Comps' }, ...COMPETITIONS.map((c) => ({ value: c, label: c }))]}
      />
    </div>
    <div style={{ flex: '1 1 100px' }}>
      <Select
        value={filter.position}
        onChange={(e) => onChange({ position: e.target.value })}
        options={[{ value: 'ALL', label: 'All Pos' }, ...POSITIONS.map((p) => ({ value: p, label: p }))]}
      />
    </div>
    <div style={{ flex: '1 1 120px' }}>
      <Input type="date" value={filter.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} placeholder="From" />
    </div>
    <div style={{ flex: '1 1 120px' }}>
      <Input type="date" value={filter.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} placeholder="To" />
    </div>
    <Button
      variant={filter.pinnedOnly ? 'accent' : 'ghost'}
      size="sm"
      icon={<Pin size={13} />}
      onClick={() => onChange({ pinnedOnly: !filter.pinnedOnly })}
      title="Show pinned only"
    />
    <Button variant="ghost" size="sm" onClick={onReset}>Reset</Button>
  </div>
);
