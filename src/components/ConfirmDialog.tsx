import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Sil',
  cancelText = 'Ləğv et',
  loading = false,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      {message ? (
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </DialogContent>
      ) : null}
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>{cancelText}</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
