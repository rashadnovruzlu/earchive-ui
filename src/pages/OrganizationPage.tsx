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
import ApartmentRounded from '@mui/icons-material/ApartmentRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { alpha, useTheme } from '@mui/material/styles';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Organization } from '../types/api';

type Notice = { tone: 'success' | 'error'; message: string };
type OrganizationFormState = {
  name: string;
  email: string;
  phone: string;
};

const emptyOrganizationForm = (): OrganizationFormState => ({ name: '', email: '', phone: '' });

export default function OrganizationPage() {
  const theme = useTheme();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>(emptyOrganizationForm());
  const [editingOrganizationId, setEditingOrganizationId] = useState<number | null>(null);
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const data = await api.getOrganizations();
      const ordered = [...(data ?? [])].sort((a, b) => a.id - b.id);
      setOrganizations(ordered);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Təşkilatlar yüklənərkən xəta baş verdi.';
      setNotice({ tone: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrganizations();
  }, []);

  const openCreateOrganization = () => {
    setEditingOrganizationId(null);
    setOrganizationForm(emptyOrganizationForm());
    setFormOpen(true);
  };

  const openEditOrganization = (organization: Organization) => {
    setEditingOrganizationId(organization.id);
    setOrganizationForm({
      name: organization.name,
      email: organization.email ?? '',
      phone: organization.phone ?? ''
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingOrganizationId(null);
    setOrganizationForm(emptyOrganizationForm());
  };

  const handleSaveOrganization = async (event: FormEvent) => {
    event.preventDefault();
    if (!organizationForm.name.trim()) {
      return;
    }

    setOrganizationSaving(true);
    try {
      const payload = {
        name: organizationForm.name.trim(),
        email: organizationForm.email.trim() || null,
        phone: organizationForm.phone.trim() || null,
      };

      if (editingOrganizationId !== null) {
        await api.updateOrganization(editingOrganizationId, payload);
      } else {
        await api.createOrganization(payload);
      }

      closeForm();
      setNotice({
        tone: 'success',
        message: editingOrganizationId !== null ? 'Təşkilat yeniləndi.' : 'Təşkilat yaradıldı.'
      });
      await loadOrganizations();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xəta baş verdi.';
      setNotice({ tone: 'error', message });
    } finally {
      setOrganizationSaving(false);
    }
  };

  const handleDeleteOrganization = async (organizationId: number) => {
    try {
      await api.deleteOrganization(organizationId);
      setNotice({ tone: 'success', message: 'Təşkilat silindi.' });

      if (editingOrganizationId === organizationId) {
        closeForm();
      }

      await loadOrganizations();
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
              <ApartmentRounded color="primary" />
              {editingOrganizationId === null ? <AddRounded color="primary" fontSize="small" /> : null}
              <Typography fontWeight={700}>
                {editingOrganizationId !== null ? 'Təşkilatı düzənlə' : 'Yeni təşkilat əlavə et'}
              </Typography>
              {editingOrganizationId !== null ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
            <Box component="form" onSubmit={handleSaveOrganization} sx={{ pt: 1 }}>
              <Stack spacing={2}>
                <TextField
                  autoFocus
                  label="Təşkilat adı"
                  fullWidth
                  required
                  value={organizationForm.name}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, name: event.target.value }))}
                />
                <TextField
                  label="E-poçt"
                  fullWidth
                  value={organizationForm.email}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, email: event.target.value }))}
                />
                <TextField
                  label="Telefon"
                  fullWidth
                  value={organizationForm.phone}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, phone: event.target.value }))}
                />
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={organizationSaving || !organizationForm.name.trim()}
                    startIcon={<SaveRounded />}
                    sx={{ borderRadius: 0 }}
                  >
                    {editingOrganizationId !== null ? 'Yenilə' : 'Yarat'}
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
          <ApartmentRounded color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Təşkilatlar</Typography>
          <Button size="small" variant="outlined" startIcon={<AddRounded />} onClick={openCreateOrganization}>
            Yeni təşkilat
          </Button>
        </Box>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={36} />
          </Stack>
        ) : organizations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
            Hələ təşkilat yoxdur
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Təşkilat</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əlaqə</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((organization, index) => {
                  return (
                    <TableRow
                      key={organization.id}
                      hover
                      sx={{
                        bgcolor: index % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03)
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{organization.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{organization.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="caption" color="text.secondary">{organization.email || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{organization.phone || '—'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Düzənlə">
                            <IconButton size="small" onClick={() => openEditOrganization(organization)}>
                              <EditRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(organization)}>
                              <DeleteRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
        <Typography variant="caption" color="text.secondary">
          Qeyd: Sil əməliyyatı birbaşa icra olunur.
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Təşkilatı sil"
        message={`Bu təşkilat silinəcək: ${deleteTarget?.name || ''}`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void handleDeleteOrganization(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
}
