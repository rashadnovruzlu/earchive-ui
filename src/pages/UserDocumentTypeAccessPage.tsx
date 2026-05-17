import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import SaveRounded from '@mui/icons-material/SaveRounded';
import LockResetRounded from '@mui/icons-material/LockResetRounded';
import CircularProgress from '@mui/material/CircularProgress';
import { api } from '../lib/api';
import type { DocumentType, User } from '../types/api';

type UserDocumentTypeAccessPageProps = {
  users: User[];
  documentTypes: DocumentType[];
  isBusy?: boolean;
};

export function UserDocumentTypeAccessPage({ users, documentTypes, isBusy = false }: UserDocumentTypeAccessPageProps) {
  const [userQuery, setUserQuery] = useState('');
  const [docTypeQuery, setDocTypeQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [hasAllAccess, setHasAllAccess] = useState(false);
  const [selectedDocumentTypeIds, setSelectedDocumentTypeIds] = useState<string[]>([]);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const haystack = `${user.username} ${user.fullName || ''} ${user.email || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [users, userQuery]);

  const filteredDocumentTypes = useMemo(() => {
    const query = docTypeQuery.trim().toLowerCase();
    if (!query) {
      return documentTypes;
    }

    return documentTypes.filter((item) => {
      const haystack = `${item.name} ${item.description || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [documentTypes, docTypeQuery]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const selectedUserAllowedSet = useMemo(() => new Set(selectedDocumentTypeIds), [selectedDocumentTypeIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadUserAccess() {
      if (!selectedUserId) {
        setHasAllAccess(false);
        setSelectedDocumentTypeIds([]);
        setErrorMessage(null);
        setSuccessMessage(null);
        return;
      }

      setIsLoadingAccess(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const access = await api.getUserDocumentTypeAccess(selectedUserId);
        if (cancelled) {
          return;
        }

        setHasAllAccess(access.hasAllAccess);
        setSelectedDocumentTypeIds(access.documentTypeIds || []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'İstifadəçi girişləri yüklənmədi.';
        setErrorMessage(message);
      } finally {
        if (!cancelled) {
          setIsLoadingAccess(false);
        }
      }
    }

    void loadUserAccess();

    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  function handleSelectUser(id: string) {
    setSelectedUserId(id);
  }

  function handleToggleDocumentType(documentTypeId: string, checked: boolean) {
    if (!selectedUserId) {
      return;
    }

    setSelectedDocumentTypeIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(documentTypeId);
      } else {
        next.delete(documentTypeId);
      }

      return Array.from(next);
    });
  }

  async function handleSave() {
    if (!selectedUserId) {
      return;
    }

    setIsSavingAccess(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await api.updateUserDocumentTypeAccess(selectedUserId, {
        hasAllAccess,
        documentTypeIds: selectedDocumentTypeIds
      });

      setHasAllAccess(updated.hasAllAccess);
      setSelectedDocumentTypeIds(updated.documentTypeIds || []);
      setSuccessMessage('Girişlər uğurla saxlanıldı.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Girişlər saxlanılmadı.';
      setErrorMessage(message);
    } finally {
      setIsSavingAccess(false);
    }
  }

  function handleResetUserAccess() {
    if (!selectedUserId) {
      return;
    }

    setHasAllAccess(false);
    setSelectedDocumentTypeIds([]);
    setSuccessMessage(null);
  }

  const totalAssigned = selectedDocumentTypeIds.length;
  const disableActions = isBusy || isLoadingAccess || isSavingAccess || !selectedUserId;

  return (
    <Stack spacing={2}>
      <Card sx={{ borderRadius: '4px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardHeader
          title={<Typography variant="h6" fontWeight={700}>Sənəd növü icazələri</Typography>}
          subheader="İstifadəçi üçün sənəd növü girişlərini idarə edin"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleSave}
                disabled={disableActions}
                variant="contained"
                startIcon={<SaveRounded />}
              >
                Saxla
              </Button>
              <Button
                onClick={handleResetUserAccess}
                disabled={disableActions}
                variant="outlined"
                startIcon={<LockResetRounded />}
              >
                Təmizlə
              </Button>
            </Stack>
          }
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        />
        <CardContent>
          {errorMessage ? <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}
          {successMessage ? <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert> : null}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ borderRadius: '4px', overflow: 'hidden' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <TextField
                  placeholder="İstifadəçi axtar..."
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  fullWidth
                  size="small"
                />
              </Box>
              <Stack sx={{ maxHeight: 420, overflowY: 'auto' }} divider={<Divider flexItem />}>
                {filteredUsers.map((user) => (
                  <Box
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      cursor: 'pointer',
                      bgcolor: selectedUserId === user.id ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.fullName || user.email || '—'}</Typography>
                  </Box>
                ))}
                {filteredUsers.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">İstifadəçi tapılmadı.</Typography>
                  </Box>
                ) : null}
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: '4px' }}>
              <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedUser ? `${selectedUser.username} üçün girişlər` : 'İstifadəçi seçin'}
                    </Typography>
                    {selectedUser ? (
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.fullName || selectedUser.email || 'Profil məlumatı yoxdur'}
                      </Typography>
                    ) : null}
                  </Box>
                  <Chip color="primary" label={`Təyin edilmiş: ${totalAssigned}`} />
                </Stack>
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={
                    <Switch
                      checked={hasAllAccess}
                      onChange={(_, checked) => setHasAllAccess(checked)}
                      disabled={disableActions}
                    />
                  }
                  label="Bütün sənəd növlərinə giriş"
                />
                <TextField
                  placeholder="Sənəd növü axtar..."
                  value={docTypeQuery}
                  onChange={(event) => setDocTypeQuery(event.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mt: 1.5 }}
                />
              </Box>

              <Stack spacing={0} divider={<Divider flexItem />}>
                {isLoadingAccess ? (
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : null}
                {filteredDocumentTypes.map((documentType) => {
                  const checked = selectedUserAllowedSet.has(documentType.id);

                  return (
                    <Box key={documentType.id} sx={{ px: 1.5, py: 1 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{documentType.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {documentType.description || 'Açıqlama yoxdur'}
                          </Typography>
                        </Box>
                        <FormControlLabel
                          sx={{ mr: 0 }}
                          control={
                            <Switch
                              checked={checked}
                              onChange={(_, nextChecked) => handleToggleDocumentType(documentType.id, nextChecked)}
                              disabled={disableActions || hasAllAccess}
                            />
                          }
                          label={checked ? 'İcazə var' : 'İcazə yoxdur'}
                        />
                      </Stack>
                    </Box>
                  );
                })}
                {filteredDocumentTypes.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">Sənəd növü tapılmadı.</Typography>
                  </Box>
                ) : null}
              </Stack>
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
