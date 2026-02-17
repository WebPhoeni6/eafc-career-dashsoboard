import React, { useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search…', id }) => {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div style={{ position: 'relative' }}>
      <Search
        size={14}
        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}
      />
      <input
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 11px 8px 30px',
          borderRadius: '11px',
          border: '1px solid rgba(34,48,74,0.9)',
          background: 'rgba(5,9,16,0.35)',
          color: 'var(--text)',
          outline: 'none',
          fontSize: '13px',
        }}
      />
    </div>
  );
};
