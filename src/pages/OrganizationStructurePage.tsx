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
  Collapse,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SubdirectoryArrowRightRounded from '@mui/icons-material/SubdirectoryArrowRightRounded';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type {
  OrgStructureNode,
  CreateOrgStructurePayload,
  UpdateOrgStructurePayload,
} from '../types/api';

// ─── helper types ────────────────────────────────────────────────────────────
type Notice = { tone: 'success' | 'error'; message: string };
type NodeFormState = {
  name: string;
  typeId: number | '';
  parentId: number | '';
};

const emptyNodeForm = (): NodeFormState => ({ name: '', typeId: '', parentId: '' });

// ─── flatten tree to searchable list ─────────────────────────────────────────
function flattenTree(nodes: OrgStructureNode[], depth = 0): Array<OrgStructureNode & { depth: number }> {
  return nodes.flatMap(n => [{ ...n, depth }, ...flattenTree(n.children, depth + 1)]);
}

// ─── recursive tree rendering ─────────────────────────────────────────────────
interface TreeNodeProps {
  node: OrgStructureNode;
  depth: number;
  selectedId: number | null;
  onSelect: (node: OrgStructureNode) => void;
  onEdit: (node: OrgStructureNode) => void;
  onDelete: (node: OrgStructureNode) => void;
  onAddChild: (node: OrgStructureNode) => void;
}

const INDENT_PX = 20;

function TreeNode({ node, depth, selectedId, onSelect, onEdit, onDelete, onAddChild }: TreeNodeProps) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <Box>
      <ListItem
        disablePadding
        secondaryAction={
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Alt bölmə əlavə et">
              <IconButton
                size="small"
                onClick={e => { e.stopPropagation(); onAddChild(node); }}
                sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 }, transition: 'opacity .15s' }}
              >
                <AddRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Düzəliş et">
              <IconButton
                size="small"
                onClick={e => { e.stopPropagation(); onEdit(node); }}
                sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 }, transition: 'opacity .15s' }}
              >
                <EditRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sil">
              <IconButton
                size="small"
                color="error"
                onClick={e => { e.stopPropagation(); onDelete(node); }}
                sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 }, transition: 'opacity .15s' }}
              >
                <DeleteRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        sx={{
          pl: `${depth * INDENT_PX + 8}px`,
          borderRadius: 1,
          mb: 0.25,
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.12)
            : 'transparent',
          '&:hover': { bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.light, 0.2) },
          transition: 'background .15s',
        }}
      >
        <ListItemButton
          disableRipple
          onClick={() => onSelect(node)}
          sx={{
            py: 0.75,
            px: 0,
            borderRadius: 1,
            '&:hover': { bgcolor: 'transparent' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                sx={{ p: 0.25 }}
              >
                {open ? (
                  <ExpandMoreRounded fontSize="small" />
                ) : (
                  <ChevronRightRounded fontSize="small" />
                )}
              </IconButton>
            ) : (
              <SubdirectoryArrowRightRounded
                fontSize="small"
                sx={{ color: 'text.disabled', ml: 0.25 }}
              />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body2"
                fontWeight={isSelected ? 600 : 400}
                color={isSelected ? 'primary.main' : 'text.primary'}
                noWrap
              >
                {node.name}
              </Typography>
            }
            secondaryTypographyProps={{ component: 'div' }}
            secondary={
              depth === 0 ? (
                <Chip label={node.typeName} size="small" sx={{ mt: 0.25, height: 18, fontSize: '0.65rem' }} />
              ) : null
            }
          />
        </ListItemButton>
      </ListItem>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </Collapse>
      )}
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
type OrganizationStructurePageProps = {
  onOpenTypesPage?: () => void;
};

export default function OrganizationStructurePage({ onOpenTypesPage }: OrganizationStructurePageProps) {
  const theme = useTheme();

  // data
  const [types, setTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [tree, setTree] = useState<OrgStructureNode[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [selectedNode, setSelectedNode] = useState<OrgStructureNode | null>(null);

  // search
  const [search, setSearch] = useState('');

  // notice / snackbar
  const [notice, setNotice] = useState<Notice | null>(null);

  // ── node form (accordion) ──
  const [nodeFormOpen, setNodeFormOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [nodeForm, setNodeForm] = useState<NodeFormState>(emptyNodeForm());
  const [nodeSaving, setNodeSaving] = useState(false);
  const [flatNodes, setFlatNodes] = useState<Array<OrgStructureNode & { depth: number }>>([]);
  const [deleteTarget, setDeleteTarget] = useState<OrgStructureNode | null>(null);

  // ─── load ────────────────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoadingTree(true);
    const [treeResult, typesResult] = await Promise.allSettled([
      api.getOrgStructureTree(),
      api.getOrgStructureTypes(),
    ]);

    if (treeResult.status === 'fulfilled') {
      setTree(treeResult.value);
      setFlatNodes(flattenTree(treeResult.value));
    }

    if (typesResult.status === 'fulfilled') {
      setTypes(typesResult.value);
    }

    if (treeResult.status === 'rejected' || typesResult.status === 'rejected') {
      const treeError = treeResult.status === 'rejected'
        ? (treeResult.reason instanceof Error ? treeResult.reason.message : 'Struktur yüklənmədi.')
        : null;
      const typesError = typesResult.status === 'rejected'
        ? (typesResult.reason instanceof Error ? typesResult.reason.message : 'Növlər yüklənmədi.')
        : null;
      setNotice({ tone: 'error', message: [treeError, typesError].filter(Boolean).join(' | ') });
    }

    setLoadingTree(false);
  };

  useEffect(() => { loadAll(); }, []);

  // filtered flat view for search
  const displayNodes = search.trim()
    ? flatNodes.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const ensureTypesLoaded = async () => {
    if (types.length > 0) return;
    try {
      const typesData = await api.getOrgStructureTypes();
      setTypes(typesData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Növlər yüklənmədi.';
      setNotice({ tone: 'error', message });
    }
  };

  // ─── node CRUD ────────────────────────────────────────────────────────────────
  const openAddNode = async (parentNode?: OrgStructureNode) => {
    await ensureTypesLoaded();
    setEditingNodeId(null);
    setNodeForm({
      name: '',
      typeId: parentNode ? parentNode.organizationalStructureTypeId : '',
      parentId: parentNode ? parentNode.id : '',
    });
    setNodeFormOpen(true);
  };

  const openEditNode = async (node: OrgStructureNode) => {
    await ensureTypesLoaded();
    setEditingNodeId(node.id);
    setNodeForm({
      name: node.name,
      typeId: node.organizationalStructureTypeId,
      parentId: node.parentId ?? '',
    });
    setNodeFormOpen(true);
  };

  const closeNodeForm = () => {
    setNodeFormOpen(false);
    setEditingNodeId(null);
    setNodeForm(emptyNodeForm());
  };

  const handleSaveNode = async (e: FormEvent) => {
    e.preventDefault();
    if (!nodeForm.name.trim() || nodeForm.typeId === '') return;
    setNodeSaving(true);
    const payload: CreateOrgStructurePayload | UpdateOrgStructurePayload = {
      organizationalStructureTypeId: nodeForm.typeId as number,
      parentId: nodeForm.parentId === '' ? null : nodeForm.parentId as number,
      name: nodeForm.name.trim(),
    };
    try {
      if (editingNodeId !== null) {
        await api.updateOrgStructure(editingNodeId, payload);
      } else {
        await api.createOrgStructure(payload);
      }
      closeNodeForm();
      setSelectedNode(null);
      setNotice({ tone: 'success', message: editingNodeId !== null ? 'Bölmə yeniləndi.' : 'Bölmə yaradıldı.' });
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xəta baş verdi.';
      setNotice({ tone: 'error', message });
    } finally {
      setNodeSaving(false);
    }
  };

  const handleDeleteNode = async (node: OrgStructureNode) => {
    try {
      await api.deleteOrgStructure(node.id);
      if (selectedNode?.id === node.id) setSelectedNode(null);
      if (editingNodeId === node.id) closeNodeForm();
      setNotice({ tone: 'success', message: 'Bölmə silindi.' });
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xəta baş verdi.';
      setNotice({ tone: 'error', message });
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Accordion
          expanded={nodeFormOpen}
          onChange={(_, open) => {
            setNodeFormOpen(open);
            if (!open) {
              closeNodeForm();
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
            sx={{ bgcolor: nodeFormOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <AccountTreeRounded color="primary" />
              {editingNodeId === null ? <AddRounded color="primary" fontSize="small" /> : null}
              <Typography fontWeight={700}>
                {editingNodeId !== null ? 'Bölməni düzənlə' : 'Yeni bölmə əlavə et'}
              </Typography>
              {editingNodeId !== null ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
            <Box component="form" onSubmit={handleSaveNode} sx={{ pt: 1 }}>
              <Stack spacing={2}>
                <TextField
                  label="Bölmə adı"
                  fullWidth
                  required
                  autoFocus
                  value={nodeForm.name}
                  onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))}
                />
                <TextField
                  select
                  label="Növ"
                  fullWidth
                  required
                  value={nodeForm.typeId}
                  onChange={e => setNodeForm(f => ({ ...f, typeId: Number(e.target.value) }))}
                >
                  {types.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Üst bölmə (istəyə bağlı)"
                  fullWidth
                  value={nodeForm.parentId}
                  onChange={e => setNodeForm(f => ({ ...f, parentId: e.target.value === '' ? '' : Number(e.target.value) }))}
                >
                  <MenuItem value="">— Yoxdur —</MenuItem>
                  {flatNodes
                    .filter(n => (editingNodeId !== null ? n.id !== editingNodeId : true))
                    .map(n => (
                      <MenuItem key={n.id} value={n.id}>
                        {'  '.repeat(n.depth)}{n.depth > 0 ? '↳ ' : ''}{n.name}
                      </MenuItem>
                    ))}
                </TextField>
                <Stack direction="row" spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={nodeSaving || !nodeForm.name.trim() || nodeForm.typeId === ''}
                    startIcon={<SaveRounded />}
                    sx={{ borderRadius: 0 }}
                  >
                    {editingNodeId !== null ? 'Yenilə' : 'Yarat'}
                  </Button>
                  <Button variant="outlined" sx={{ borderRadius: 0 }} onClick={closeNodeForm}>
                    Ləğv et
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
            {/* search bar */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <AccountTreeRounded fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                Təşkilat strukturu
              </Typography>
              <Button size="small" variant="outlined" onClick={onOpenTypesPage}>
                Növlər səhifəsi
              </Button>
              <TextField
                size="small"
                placeholder="Axtar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch('')}>
                        <CloseRounded fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{ width: 220 }}
              />
            </Stack>

            {/* tree body */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
              {loadingTree ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: 200 }}>
                  <CircularProgress size={36} />
                </Stack>
              ) : displayNodes !== null ? (
                /* search results flat list */
                displayNodes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                    Nəticə tapılmadı
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {displayNodes.map(n => (
                      <ListItem
                        key={n.id}
                        disablePadding
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Düzəliş et">
                              <IconButton size="small" onClick={() => openEditNode(n)}>
                                <EditRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton size="small" color="error" onClick={() => setDeleteTarget(n)}>
                                <DeleteRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        }
                        sx={{
                          pl: `${n.depth * INDENT_PX + 8}px`,
                          borderRadius: 1,
                          mb: 0.25,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.light, 0.2) },
                        }}
                      >
                        <ListItemButton
                          disableRipple
                          sx={{
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'transparent' },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {n.name}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {n.typeName}{n.parentName ? ` · ${n.parentName}` : ''}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )
              ) : tree.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ height: 240 }}>
                  <AccountTreeRounded sx={{ fontSize: 56, color: 'text.disabled' }} />
                  <Typography variant="body1" color="text.secondary">
                    Hələ heç bir bölmə əlavə edilməyib
                  </Typography>
                  <Button variant="outlined" startIcon={<AddRounded />} onClick={() => openAddNode()}>
                    İlk bölməni əlavə et
                  </Button>
                </Stack>
              ) : (
                <List dense disablePadding>
                  {tree.map(rootNode => (
                    <TreeNode
                      key={rootNode.id}
                      node={rootNode}
                      depth={0}
                      selectedId={selectedNode?.id ?? null}
                      onSelect={n => setSelectedNode(n)}
                      onEdit={openEditNode}
                      onDelete={(node) => setDeleteTarget(node)}
                      onAddChild={openAddNode}
                    />
                  ))}
                </List>
              )}
            </Box>

            {/* selected node detail strip */}
            <Collapse in={!!selectedNode}>
              {selectedNode && (
                <Box
                  sx={{
                    borderTop: `1px solid ${theme.palette.divider}`,
                    px: 2,
                    py: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {selectedNode.name}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={selectedNode.typeName} size="small" color="primary" variant="outlined" />
                        {selectedNode.parentName && (
                          <Chip
                            label={`Üst: ${selectedNode.parentName}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<AddRounded />}
                        onClick={() => openAddNode(selectedNode)}
                      >
                        Alt bölmə
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditRounded />}
                        onClick={() => openEditNode(selectedNode)}
                      >
                        Düzəliş
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteRounded />}
                        onClick={() => setDeleteTarget(selectedNode)}
                      >
                        Sil
                      </Button>
                      <IconButton size="small" onClick={() => setSelectedNode(null)}>
                        <CloseRounded fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </Collapse>
      </Paper>

      {/* ════════════════════════════════════════
          SNACKBAR
      ════════════════════════════════════════ */}

      {/* ── snackbar ── */}
      <Snackbar
        open={!!notice}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice?.tone}
          onClose={() => setNotice(null)}
          sx={{ width: '100%' }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Bölməni sil"
        message={`Bu bölmə silinəcək: ${deleteTarget?.name || ''}`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void handleDeleteNode(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
}
