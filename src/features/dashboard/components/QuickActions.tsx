import React from 'react';
import { PlusCircle, Download, Share2, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  onNewMatch: () => void;
  onExport: () => void;
  onShare?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNewMatch, onExport, onShare }) => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="green" icon={<PlusCircle size={15} />} onClick={onNewMatch}>
        New Match <kbd style={{ opacity: 0.6, fontSize: '11px', marginLeft: '4px' }}>N</kbd>
      </Button>
      {onShare && (
        <Button variant="ghost" icon={<Share2 size={14} />} onClick={onShare}>
          Share Stats
        </Button>
      )}
      <Button variant="ghost" icon={<Download size={14} />} onClick={onExport}>
        Export <kbd style={{ opacity: 0.6, fontSize: '11px', marginLeft: '4px' }}>E</kbd>
      </Button>
      <Button variant="ghost" icon={<User size={14} />} onClick={() => navigate('/profile')}>
        Edit Profile
      </Button>
    </div>
  );
};
