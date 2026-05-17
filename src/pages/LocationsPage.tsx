import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
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
  useTheme
} from '@mui/material';
import { SimpleTreeView, TreeItem, treeItemClasses } from '@mui/x-tree-view';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import QrCodeRounded from '@mui/icons-material/QrCodeRounded';
import Container from '@mui/material/Container';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../features/auth/AuthProvider';
import { api } from '../lib/api';
import {
  type CreateLogicalLocationPayload,
  type LogicalLocation,
  type OrgStructureNode,
  type PhysicalLocation,
  type UpdateLogicalLocationPayload,
  type CreatePhysicalLocationPayload,
  type UpdatePhysicalLocationPayload,
  locationLevelOptions,
  type LocationLevel
} from '../types/api';

type Notice = {
  tone: 'success' | 'error';
  message: string;
};

type LogicalLocationForm = {
  id?: string;
  name: string;
  level: number;
  parentId?: string;
  organizationalStructureId?: number;
};

type PhysicalLocationForm = {
  id?: string;
  name: string;
  logicalLocationId: string;
  totalSpace: number;
  usedSpace: number;
  barcode: string;
};

const emptyLogicalForm = (): LogicalLocationForm => ({
  name: '',
  level: 1,
  parentId: undefined,
  organizationalStructureId: undefined
});

function flattenOrgStructure(nodes: OrgStructureNode[], depth = 0): Array<{ id: number; name: string; depth: number }> {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenOrgStructure(node.children, depth + 1)
  ]);
}

const emptyPhysicalForm = (): PhysicalLocationForm => ({
  name: '',
  logicalLocationId: '',
  totalSpace: 100,
  usedSpace: 0,
  barcode: ''
});

const drawerWidth = 360;

export function LocationsPage() {
  const { logout, session } = useAuth();
  const theme = useTheme();

  const [logicalLocations, setLogicalLocations] = useState<LogicalLocation[]>([]);
  const [physicalLocations, setPhysicalLocations] = useState<PhysicalLocation[]>([]);
  const [selectedLogicalId, setSelectedLogicalId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [logicalForm, setLogicalForm] = useState<LogicalLocationForm>(emptyLogicalForm);
  const [logicalFormOpen, setLogicalFormOpen] = useState(true);

  const [physicalForm, setPhysicalForm] = useState<PhysicalLocationForm>(emptyPhysicalForm);
  const [physicalFormOpen, setPhysicalFormOpen] = useState(false);
  const [orgStructureOptions, setOrgStructureOptions] = useState<Array<{ id: number; name: string; depth: number }>>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'logical' | 'physical'; id: string; name: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const selectMenuProps = {
    PaperProps: {
      sx: {
        mt: 0.5,
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.24),
        borderRadius: 1.5,
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.16)'
      }
    }
  };

  const selectedLogical = useMemo(() => {
    function findInTree(items: LogicalLocation[]): LogicalLocation | undefined {
      for (const item of items) {
        if (item.id === selectedLogicalId) return item;
        if (item.children?.length > 0) {
          const found = findInTree(item.children);
          if (found) return found;
        }
      }
      return undefined;
    }
    return findInTree(logicalLocations);
  }, [logicalLocations, selectedLogicalId]);
  const selectedPhysicals = useMemo(
    () => physicalLocations.filter((p) => p.logicalLocationId === selectedLogicalId),
    [physicalLocations, selectedLogicalId]
  );

  const totalCapacity = useMemo(
    () => selectedPhysicals.reduce((acc, p) => acc + p.totalSpace, 0),
    [selectedPhysicals]
  );
  const usedCapacity = useMemo(
    () => selectedPhysicals.reduce((acc, p) => acc + p.usedSpace, 0),
    [selectedPhysicals]
  );
  const utilizationPercent = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

  async function loadData() {
    setIsLoading(true);
    try {
      const [logical, physical] = await Promise.all([
        api.getLogicalLocationHierarchy(),
        api.getPhysicalLocations()
      ]);
      setLogicalLocations(logical);
      setPhysicalLocations(physical);

      try {
        const orgTree = await api.getOrgStructureTree();
        setOrgStructureOptions(flattenOrgStructure(orgTree));
      } catch {
        setOrgStructureOptions([]);
      }

      if (logical.length > 0 && !selectedLogicalId) {
        setSelectedLogicalId(logical[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Məlumatlar yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setIsBusy(true);
    setNotice(null);

    try {
      await action();
      setNotice({ tone: 'success', message: successMessage });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Əməliyyat uğursuz oldu.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogicalFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isBuildingLevel = logicalForm.level === 1;
    if (isBuildingLevel && !logicalForm.organizationalStructureId) {
      setNotice({ tone: 'error', message: 'Bina səviyyəsi üçün struktur bölməsi seçilməlidir.' });
      return;
    }

    await runAction(async () => {
      const payload: CreateLogicalLocationPayload | UpdateLogicalLocationPayload = {
        name: logicalForm.name,
        level: logicalForm.level,
        parentId: logicalForm.parentId || null,
        organizationalStructureId: logicalForm.organizationalStructureId || null
      };

      if (logicalForm.id) {
        await api.updateLogicalLocation(logicalForm.id, payload);
      } else {
        await api.createLogicalLocation(payload);
      }

      setLogicalForm(emptyLogicalForm());
      setLogicalFormOpen(false);
    }, logicalForm.id ? 'Məntiqi yerləşdirmə yeniləndi.' : 'Məntiqi yerləşdirmə yaradıldı.');
  }

  async function handlePhysicalFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLogicalId && !physicalForm.logicalLocationId) {
      setNotice({ tone: 'error', message: 'Məntiqi yerləşdirmə seçin.' });
      return;
    }

    await runAction(async () => {
      const payload: CreatePhysicalLocationPayload | UpdatePhysicalLocationPayload = {
        name: physicalForm.name,
        logicalLocationId: physicalForm.logicalLocationId || selectedLogicalId!,
        totalSpace: physicalForm.totalSpace,
        usedSpace: physicalForm.usedSpace,
        barcode: physicalForm.barcode || null
      };

      if (physicalForm.id) {
        await api.updatePhysicalLocation(physicalForm.id, payload);
      } else {
        await api.createPhysicalLocation(payload);
      }

      setPhysicalForm(emptyPhysicalForm());
      setPhysicalFormOpen(false);
    }, physicalForm.id ? 'Fiziki yerləşdirmə yeniləndi.' : 'Fiziki yerləşdirmə yaradıldı.');
  }

  function startEditingLogical(item: LogicalLocation) {
    setLogicalForm({
      id: item.id,
      name: item.name,
      level: locationLevelOptions.find((o) => o.name === item.level)?.value || 1,
      parentId: item.parentId || undefined,
      organizationalStructureId: item.organizationalStructureId ?? undefined
    });
    setLogicalFormOpen(true);
  }

  function startEditingPhysical(item: PhysicalLocation) {
    setPhysicalForm({
      id: item.id,
      name: item.name,
      logicalLocationId: item.logicalLocationId,
      totalSpace: item.totalSpace,
      usedSpace: item.usedSpace,
      barcode: item.barcode || ''
    });
    setPhysicalFormOpen(true);
  }
  function getLevelColor(level: LocationLevel): string {
    const colors: Record<LocationLevel, string> = {
      Building: '#1976d2',
      Floor: '#388e3c',
      Room: '#f57c00',
      Shelf: '#c2185b',
      Box: '#7b1fa2'
    };
    return colors[level] || '#757575';
  }

  function getLevelLabel(level: LocationLevel): string {
    return locationLevelOptions.find((o) => o.name === level)?.label || '';
  }

  function renderTreeItems(items: LogicalLocation[]): React.ReactNode {
    return items.map((item) => {
      const physicalCount = physicalLocations.filter((p) => p.logicalLocationId === item.id).length;
      const levelLabel = getLevelLabel(item.level);
      const levelColor = getLevelColor(item.level);

      return (
        <TreeItem
          key={item.id}
          itemId={item.id}
          label={
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ py: 0.75, px: 0.25, width: '100%' }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1,
                  bgcolor: alpha(levelColor, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <StorageRounded sx={{ fontSize: 16, color: levelColor }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                  {levelLabel}
                </Typography>
              </Box>
              <Chip
                label={physicalCount}
                size="small"
                variant="outlined"
                sx={{ flexShrink: 0, height: 20, fontSize: '0.7rem', fontWeight: 600 }}
              />
            </Stack>
          }
        >
          {item.children.length > 0 && renderTreeItems(item.children)}
        </TreeItem>
      );
    });
  }

  return (
    <Box className="page-shell page-fade-in" sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar with TreeView */}
      <Paper
        component="nav"
        sx={{
          width: { lg: drawerWidth },
          flexShrink: { lg: 0 },
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          borderRadius: 0,
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
          borderRight: '1px solid',
          borderColor: 'divider',
          zIndex: theme.zIndex.drawer,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
        }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: 'primary.main' }}>
            Yerləşdirmələr
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Məntiqi strukturunuzu idarə edin
          </Typography>
        </Box>

        <Box sx={{ px: 2, pt: 1.25 }}>
          <Button
            fullWidth
            size="small"
            variant="contained"
            startIcon={<AddRounded />}
            onClick={() => {
              setLogicalForm({ ...emptyLogicalForm(), parentId: selectedLogicalId || undefined });
              setLogicalFormOpen(true);
            }}
            sx={{ borderRadius: 1.25, textTransform: 'none' }}
          >
            Yeni Məntiqi Bölmə
          </Button>
        </Box>

        {/* Inline Logical Form (always visible for add mode) */}
        <Collapse in={logicalFormOpen && !logicalForm.id}>
          <Box component="form" onSubmit={handleLogicalFormSubmit} sx={{ px: 2, pb: 2, pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Yeni Məntiqi Yerləşdirmə
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Ad"
                  required
                  value={logicalForm.name}
                  onChange={(e) => setLogicalForm((c) => ({ ...c, name: e.target.value }))}
                  fullWidth
                  size="small"
                  autoFocus
                />
                <TextField
                  label="Səviyyə"
                  select
                  required
                  value={logicalForm.level}
                  onChange={(e) => {
                    const level = Number(e.target.value);
                    setLogicalForm((c) => ({
                      ...c,
                      level,
                      organizationalStructureId: level === 1 ? c.organizationalStructureId : undefined
                    }));
                  }}
                  fullWidth
                  size="small"
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  {locationLevelOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                {logicalForm.level === 1 ? (
                  <TextField
                    label="Struktur bölməsi"
                    select
                    required
                    value={logicalForm.organizationalStructureId ?? ''}
                    onChange={(e) => setLogicalForm((c) => ({
                      ...c,
                      organizationalStructureId: e.target.value === '' ? undefined : Number(e.target.value)
                    }))}
                    fullWidth
                    size="small"
                    helperText="Bina səviyyəsi üçün məcburidir."
                    SelectProps={{ MenuProps: selectMenuProps }}
                  >
                    <MenuItem value="">Seçin</MenuItem>
                    {orgStructureOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {`${'  '.repeat(option.depth)}${option.depth > 0 ? '↳ ' : ''}${option.name}`}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    onClick={() => {
                      setLogicalForm({ ...emptyLogicalForm(), parentId: selectedLogicalId || undefined });
                      setLogicalFormOpen(false);
                    }}
                  >
                    Ləğv et
                  </Button>
                  <Button size="small" variant="contained" type="submit" disabled={isBusy} sx={{ borderRadius: 1, textTransform: 'none' }}>
                    Yadda saxla
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        </Collapse>

        {/* Tree Content */}
        <Box sx={{ flex: 1, p: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : logicalLocations.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 1 }}>
              Yerləşdirmə tapılmadı
            </Alert>
          ) : (
            <SimpleTreeView
              expandedItems={expandedIds}
              onExpandedItemsChange={(_: React.SyntheticEvent | null, nodeIds: string[]) => setExpandedIds(nodeIds)}
              selectedItems={selectedLogicalId || ''}
              onSelectedItemsChange={(_: React.SyntheticEvent | null, itemId: string | null) => {
                if (itemId) setSelectedLogicalId(itemId);
              }}
              sx={{
                [`& .${treeItemClasses.content}`]: {
                  borderRadius: '8px',
                  py: 0.25,
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.07)
                  },
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.18)
                    }
                  },
                  '&.Mui-focused': {
                    bgcolor: 'transparent'
                  },
                  '&.Mui-focused.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.14)
                  }
                },
                [`& .${treeItemClasses.groupTransition}`]: {
                  ml: 2,
                  pl: 1,
                  borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`
                }
              }}
            >
              {renderTreeItems(logicalLocations.filter((l) => !l.parentId))}
            </SimpleTreeView>
          )}
        </Box>
      </Paper>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, width: { lg: `calc(100% - ${drawerWidth}px)` }, ml: { lg: `${drawerWidth}px` }, bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }} className="card-reveal">
          <Stack spacing={2.5}>
            {selectedLogical ? (
              <>
                {/* Header Card — view or inline edit */}
                {logicalFormOpen && logicalForm.id ? (
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'primary.main', boxShadow: 'none' }}>
                    <Box component="form" onSubmit={handleLogicalFormSubmit}>
                      <CardContent sx={{ pb: 2 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={700}>Məntiqi Yerləşdirmə Düzənlə</Typography>
                          <IconButton size="small" onClick={() => { setLogicalFormOpen(false); setLogicalForm(emptyLogicalForm()); }}>
                            <CloseRounded fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Stack spacing={2}>
                          <TextField
                            label="Ad"
                            required
                            value={logicalForm.name}
                            onChange={(e) => setLogicalForm((c) => ({ ...c, name: e.target.value }))}
                            fullWidth
                            size="small"
                            autoFocus
                          />
                          <TextField
                            label="Səviyyə"
                            select
                            required
                            value={logicalForm.level}
                            onChange={(e) => {
                              const level = Number(e.target.value);
                              setLogicalForm((c) => ({
                                ...c,
                                level,
                                organizationalStructureId: level === 1 ? c.organizationalStructureId : undefined
                              }));
                            }}
                            fullWidth
                            size="small"
                            SelectProps={{ MenuProps: selectMenuProps }}
                          >
                            {locationLevelOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          {logicalForm.level === 1 ? (
                            <TextField
                              label="Struktur bölməsi"
                              select
                              required
                              value={logicalForm.organizationalStructureId ?? ''}
                              onChange={(e) => setLogicalForm((c) => ({
                                ...c,
                                organizationalStructureId: e.target.value === '' ? undefined : Number(e.target.value)
                              }))}
                              fullWidth
                              size="small"
                              helperText="Bina səviyyəsi üçün məcburidir."
                              SelectProps={{ MenuProps: selectMenuProps }}
                            >
                              <MenuItem value="">Seçin</MenuItem>
                              {orgStructureOptions.map((option) => (
                                <MenuItem key={option.id} value={option.id}>
                                  {`${'  '.repeat(option.depth)}${option.depth > 0 ? '↳ ' : ''}${option.name}`}
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : null}
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => { setLogicalFormOpen(false); setLogicalForm(emptyLogicalForm()); }}>
                              Ləğv et
                            </Button>
                            <Button size="small" variant="contained" type="submit" disabled={isBusy} sx={{ borderRadius: 1, textTransform: 'none' }}>
                              Yadda saxla
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Box>
                  </Card>
                ) : (
                <Card
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
                  }}
                >
                  <CardContent sx={{ pb: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: getLevelColor(selectedLogical.level),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <StorageRounded sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {selectedLogical.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getLevelLabel(selectedLogical.level)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Düzənlə">
                          <IconButton size="small" onClick={() => startEditingLogical(selectedLogical)} sx={{ borderRadius: 1 }}>
                            <EditRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({ type: 'logical', id: selectedLogical.id, name: selectedLogical.name })}
                            sx={{ borderRadius: 1 }}
                          >
                            <DeleteRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
                )}

                {/* Summary Stats */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Card sx={{ 
                    borderRadius: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    flex: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: 'primary.main'
                    }
                  }}>
                    <CardContent>
                      <Typography variant="overline" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Fiziki Yerləşdirmələr
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="primary.main">
                        {selectedPhysicals.length}
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ 
                    borderRadius: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    flex: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: 'success.main'
                    }
                  }}>
                    <CardContent>
                      <Typography variant="overline" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Ümumi Sahə
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="success.main">
                        {totalCapacity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        vahid
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card sx={{ 
                    borderRadius: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    flex: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: 'warning.main'
                    }
                  }}>
                    <CardContent>
                      <Typography variant="overline" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                        İstifadə Edilən
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="warning.main">
                        {usedCapacity}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {utilizationPercent}% istifadə
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>

                {/* Capacity Progress */}
                {totalCapacity > 0 && (
                  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="overline" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                        Ümumi Kapasite Durumu
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={utilizationPercent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            flex: 1,
                            backgroundColor: alpha('#0057B8', 0.12),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: utilizationPercent > 80 ? '#d32f2f' : utilizationPercent > 50 ? '#f57c00' : '#388e3c'
                            }
                          }}
                        />
                        <Typography variant="body2" fontWeight={700} sx={{ minWidth: 50, textAlign: 'right' }}>
                          {utilizationPercent}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Physical Locations Table */}
                <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="h6" fontWeight={700}>
                          Fiziki Yerləşdirmələr
                        </Typography>
                        <Chip label={selectedPhysicals.length} size="small" variant="filled" />
                      </Stack>
                    }
                    action={
                      <Button
                        size="small"
                        variant={physicalFormOpen ? 'outlined' : 'contained'}
                        startIcon={physicalFormOpen && !physicalForm.id ? <CloseRounded /> : <AddRounded />}
                        onClick={() => {
                          if (physicalFormOpen && !physicalForm.id) {
                            setPhysicalFormOpen(false);
                            setPhysicalForm(emptyPhysicalForm());
                          } else {
                            setPhysicalForm({ ...emptyPhysicalForm(), logicalLocationId: selectedLogicalId! });
                            setPhysicalFormOpen(true);
                          }
                        }}
                        sx={{ borderRadius: 1, textTransform: 'none' }}
                      >
                        {physicalFormOpen && !physicalForm.id ? 'Ləğv et' : 'Yeni Fiziki Bölmə'}
                      </Button>
                    }
                    sx={{ pb: 0, borderBottom: '1px solid', borderColor: 'divider' }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {/* Inline physical form */}
                    <Collapse in={physicalFormOpen}>
                      <Box component="form" onSubmit={handlePhysicalFormSubmit} sx={{ p: 2 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {physicalForm.id ? 'Fiziki Yerləşdirmə Düzənlə' : 'Yeni Fiziki Yerləşdirmə'}
                        </Typography>
                        <Stack spacing={1.5}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <TextField
                              label="Ad"
                              required
                              value={physicalForm.name}
                              onChange={(e) => setPhysicalForm((c) => ({ ...c, name: e.target.value }))}
                              fullWidth
                              size="small"
                              autoFocus
                            />
                            <TextField
                              label="Ştrikh Kodu"
                              value={physicalForm.barcode}
                              onChange={(e) => setPhysicalForm((c) => ({ ...c, barcode: e.target.value }))}
                              fullWidth
                              size="small"
                            />
                          </Stack>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <TextField
                              label="Ümumi Sahə"
                              type="number"
                              required
                              value={physicalForm.totalSpace}
                              onChange={(e) => setPhysicalForm((c) => ({ ...c, totalSpace: Number(e.target.value) }))}
                              inputProps={{ min: 1 }}
                              fullWidth
                              size="small"
                            />
                            <TextField
                              label="İstifadə Edilən Sahə"
                              type="number"
                              value={physicalForm.usedSpace}
                              onChange={(e) => setPhysicalForm((c) => ({ ...c, usedSpace: Math.max(0, Number(e.target.value)) }))}
                              inputProps={{ min: 0, max: physicalForm.totalSpace }}
                              helperText={`Maks: ${physicalForm.totalSpace}`}
                              fullWidth
                              size="small"
                            />
                          </Stack>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => { setPhysicalFormOpen(false); setPhysicalForm(emptyPhysicalForm()); }}>
                              Ləğv et
                            </Button>
                            <Button size="small" variant="contained" type="submit" disabled={isBusy} sx={{ borderRadius: 1, textTransform: 'none' }}>
                              Yadda saxla
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                      <Divider />
                    </Collapse>
                    {selectedPhysicals.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                        <Typography color="text.secondary">Bu məntiqi yerləşdirmə üçün fiziki yerləşdirmə yoxdur.</Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                              <TableCell sx={{ fontWeight: 700 }}>Ad</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Ümumi Sahə</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Kapasite</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Əməliyyatlar</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedPhysicals.map((physical, idx) => {
                              const utilization = physical.totalSpace > 0 ? (physical.usedSpace / physical.totalSpace) * 100 : 0;
                              return (
                                <TableRow key={physical.id} hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha(theme.palette.primary.main, 0.02) }}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        {physical.name}
                                      </Typography>
                                      {physical.barcode && (
                                        <Typography variant="caption" color="text.secondary">
                                          {physical.barcode}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                      {physical.totalSpace}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Stack spacing={0.5}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={utilization}
                                        sx={{
                                          height: 6,
                                          borderRadius: 3,
                                          backgroundColor: alpha('#0057B8', 0.12),
                                          '& .MuiLinearProgress-bar': {
                                            backgroundColor: utilization > 80 ? '#d32f2f' : utilization > 50 ? '#f57c00' : '#388e3c'
                                          }
                                        }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {physical.usedSpace} / {physical.totalSpace} ({utilization.toFixed(0)}%)
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                      {physical.qrCode && (
                                        <Tooltip title="QR Kodu Göstər">
                                          <IconButton
                                            size="small"
                                            onClick={() => setQrCodeUrl(physical.qrCodeImagePath || null)}
                                            sx={{ borderRadius: 1 }}
                                          >
                                            <QrCodeRounded fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      <Tooltip title="Düzənlə">
                                        <IconButton size="small" onClick={() => startEditingPhysical(physical)} sx={{ borderRadius: 1 }}>
                                          <EditRounded fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Sil">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => setDeleteConfirm({ type: 'physical', id: physical.id, name: physical.name })}
                                          sx={{ borderRadius: 1 }}
                                        >
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
                  </CardContent>
                </Card>
              </>
            ) : isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Başlamaq üçün sol paneldən bir məntiqi yerləşdirmə seçin.
              </Alert>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Silməyi Təsdiq Et</DialogTitle>
        <DialogContent>
          <Typography>
            "{deleteConfirm?.name}" əminiz ki silmək istəyirsiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Ləğv et</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (!deleteConfirm) return;
              void runAction(
                async () => {
                  if (deleteConfirm.type === 'logical') {
                    await api.deleteLogicalLocation(deleteConfirm.id);
                  } else {
                    await api.deletePhysicalLocation(deleteConfirm.id);
                  }
                },
                deleteConfirm.type === 'logical' ? 'Məntiqi yerləşdirmə silindi.' : 'Fiziki yerləşdirmə silindi.'
              );
              setDeleteConfirm(null);
              if (deleteConfirm.type === 'logical') {
                setSelectedLogicalId(null);
              }
            }}
            disabled={isBusy}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={Boolean(qrCodeUrl)} onClose={() => setQrCodeUrl(null)} maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>QR Kodu</DialogTitle>
        <DialogContent>
          {qrCodeUrl && <Box component="img" src={qrCodeUrl} sx={{ width: '100%', mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrCodeUrl(null)}>Bağla</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        autoHideDuration={4000}
        open={Boolean(notice)}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notice ? <Alert severity={notice.tone}>{notice.message}</Alert> : <span />}
      </Snackbar>
    </Box>
  );
}
