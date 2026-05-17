import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import type { DocumentMovement, PhysicalLocation } from '../types/api';
import { api } from '../lib/api';

type Notice = {
  tone: 'success' | 'error';
  message: string;
};

type DocumentMovementsPageProps = {
  isBusy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => Promise<void>;
  setNotice: (notice: Notice | null) => void;
  initialDocumentId?: string | null;
  initialDocumentTitle?: string;
};

export function DocumentMovementsPage({
  isBusy,
  runAction,
  setNotice
}: DocumentMovementsPageProps) {
  const [pendingReceipts, setPendingReceipts] = useState<DocumentMovement[]>([]);
  const [receiveNotesById, setReceiveNotesById] = useState<Record<string, string>>({});
  const [receivePhysicalLocationById, setReceivePhysicalLocationById] = useState<Record<string, string>>({});
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [physicalLocations, setPhysicalLocations] = useState<PhysicalLocation[]>([]);

  useEffect(() => {
    setIsLoadingPending(true);
    void Promise.all([api.getPendingMovementReceipts(), api.getPhysicalLocations()])
      .then(([rows, locations]) => {
        setPendingReceipts(rows);
        setPhysicalLocations(locations);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Gözləyən qəbul siyahısı yüklənmədi.';
        setNotice({ tone: 'error', message });
      })
      .finally(() => setIsLoadingPending(false));
  }, [setNotice]);

  async function handleReceiveMovement(movementId: string) {
    const physicalLocationId = receivePhysicalLocationById[movementId];
    if (!physicalLocationId) {
      setNotice({ tone: 'error', message: 'Fiziki yerləşdirmə seçin.' });
      return;
    }

    await runAction(async () => {
      await api.receiveDocumentMovement(movementId, {
        toPhysicalLocationId: physicalLocationId,
        notes: (receiveNotesById[movementId] || '').trim() || undefined
      });
      const rows = await api.getPendingMovementReceipts();
      setPendingReceipts(rows);
      setReceiveNotesById((current) => ({ ...current, [movementId]: '' }));
      setReceivePhysicalLocationById((current) => ({ ...current, [movementId]: '' }));
    }, 'Sənəd qəbulu tamamlandı.');
  }

  return (
    <Stack spacing={2}>
      <Card sx={{ borderRadius: '4px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardHeader
          avatar={<DoneAllRounded color="primary" />}
          title={<Typography variant="h6" fontWeight={700}>Gözləyən qəbullar</Typography>}
          subheader="Yalnız sizin qəbul edə biləcəyiniz hərəkətlər"
        />
        <CardContent>
          {isLoadingPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : pendingReceipts.length === 0 ? (
            <Alert severity="info">Gözləyən qəbul yoxdur.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {pendingReceipts.map((movement) => (
                <Box key={movement.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '4px', p: 1.5 }}>
                  <Stack spacing={1}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" fontWeight={700}>{movement.documentTitle}</Typography>
                      <Chip size="small" color="warning" label="Qəbul gözləyir" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {movement.fromLocationName || '—'} {' -> '} Gözlənilir | Verən: {movement.movedByUsername || '—'} | {new Date(movement.givingDate).toLocaleString()}
                    </Typography>
                    <TextField
                      select
                      size="small"
                      label="Fiziki yerləşdirmə"
                      value={receivePhysicalLocationById[movement.id] || ''}
                      onChange={(e) => setReceivePhysicalLocationById((current) => ({ ...current, [movement.id]: e.target.value }))}
                      fullWidth
                      required
                    >
                      <MenuItem value="">Seçin</MenuItem>
                      {physicalLocations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="Qəbul qeydi"
                      value={receiveNotesById[movement.id] || ''}
                      onChange={(event) => setReceiveNotesById((current) => ({ ...current, [movement.id]: event.target.value }))}
                      fullWidth
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void handleReceiveMovement(movement.id)}
                        disabled={isBusy}
                      >
                        Qəbul et
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {pendingReceipts.length > 0 ? null : (
        <Box sx={{ px: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Qəbul ediləcək sənəd hərəkətləri olduqda göndərən və qəbul edən məlumatları burada görünəcək.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
