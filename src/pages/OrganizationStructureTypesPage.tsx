import React, { useEffect, useState, type FormEvent } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import CategoryRounded from '@mui/icons-material/CategoryRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { alpha, useTheme } from '@mui/material/styles';
import { api } from '../lib/api';
import type { OrgStructureType } from '../types/api';

type Notice = { tone: 'success' | 'error'; message: string };
type TypeFormState = { name: string };

const emptyTypeForm = (): TypeFormState => ({ name: '' });

export default function OrganizationStructureTypesPage() {
  const theme = useTheme();

  const [types, setTypes] = useState<OrgStructureType[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [typeForm, setTypeForm] = useState<TypeFormState>(emptyTypeForm());
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [typeSaving, setTypeSaving] = useState(false);

  const loadTypes = async () => {
    setLoading(true);
    try {
      const data = await api.getOrgStructureTypes();
      setTypes(data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Növlər yüklənərkən xəta baş verdi.';
      setNotice({ tone: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const openCreateType = () => {
    setEditingTypeId(null);
    setTypeForm(emptyTypeForm());
    setFormOpen(true);
  };

  const openEditType = (type: OrgStructureType) => {
    setEditingTypeId(type.id);
    setTypeForm({ name: type.name });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTypeId(null);
    setTypeForm(emptyTypeForm());
  };

  const handleSaveType = async (e: FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;
    setTypeSaving(true);
    try {
      if (editingTypeId !== null) {
        await api.updateOrgStructureType(editingTypeId, { name: typeForm.name.trim() });
      } else {
        await api.createOrgStructureType({ name: typeForm.name.trim() });
      }
      closeForm();
      setNotice({ tone: 'success', message: editingTypeId !== null ? 'Növ yeniləndi.' : 'Növ yaradıldı.' });
      await loadTypes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xəta baş verdi.';
      setNotice({ tone: 'error', message });
    } finally {
      setTypeSaving(false);
    }
  };

  const handleDeleteType = async (typeId: number) => {
    try {
      await api.deleteOrgStructureType(typeId);
      setNotice({ tone: 'success', message: 'Növ silindi.' });
      if (editingTypeId === typeId) {
        closeForm();
      }
      await loadTypes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xəta baş verdi.';
      setNotice({ tone: 'error', message });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Accordion
          expanded={formOpen}
          onChange={(_, open) => {
            setFormOpen(open);
            if (!open) {
              closeForm();
            }
          }}
          disableGutters
          sx={{
            borderRadius: '0 !important',
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 2,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreRounded />}
            sx={{ bgcolor: formOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CategoryRounded color="primary" />
              {editingTypeId === null ? <AddRounded color="primary" fontSize="small" /> : null}
              <Typography fontWeight={700}>
                {editingTypeId !== null ? 'Struktur növünü düzənlə' : 'Yeni struktur növü əlavə et'}
              </Typography>
              {editingTypeId !== null ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
            <Box component="form" onSubmit={handleSaveType} sx={{ pt: 1 }}>
              <Stack spacing={2}>
                <TextField
                  autoFocus
                  label="Növ adı"
                  fullWidth
                  required
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ name: e.target.value })}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={typeSaving || !typeForm.name.trim()}
                    startIcon={<SaveRounded />}
                    sx={{ borderRadius: 0 }}
                  >
                    {editingTypeId !== null ? 'Yenilə' : 'Yarat'}
                  </Button>
                  <Button variant="outlined" sx={{ borderRadius: 0 }} onClick={closeForm}>
                    Ləğv et
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <CategoryRounded color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Struktur növləri</Typography>
          <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={openCreateType}>
            Yeni növ
          </Button>
        </Box>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={36} />
          </Stack>
        ) : types.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
            Hələ növ yoxdur
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Növ adı</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {types.map((type, idx) => (
                  <TableRow key={type.id} hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03) }}>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{type.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{type.name}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Düzənlə">
                          <IconButton size="small" onClick={() => openEditType(type)}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton size="small" color="error" onClick={() => handleDeleteType(type.id)}>
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Typography variant="caption" color="text.secondary">
          Qeyd: Sil əməliyyatı birbaşa icra olunur. Əgər bu növə bağlı struktur elementləri varsa backend məhdudiyyətinə əsasən silinməyə bilər.
        </Typography>
      </Paper>

      <Snackbar
        open={!!notice}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notice?.tone} onClose={() => setNotice(null)} sx={{ width: '100%' }}>
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
