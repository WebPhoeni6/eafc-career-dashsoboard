import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title = 'Confirm', message, confirmLabel = 'Confirm', onConfirm, onCancel, danger,
}) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    width="420px"
    actions={
      <>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'green'} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }
  >
    <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{message}</p>
  </Modal>
);
