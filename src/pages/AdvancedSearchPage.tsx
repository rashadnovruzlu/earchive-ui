import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import FullscreenRounded from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ManageSearchRounded from '@mui/icons-material/ManageSearchRounded';
import FolderOpenRounded from '@mui/icons-material/FolderOpenRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { useAuth } from '../features/auth/AuthProvider';
import { api } from '../lib/api';
import type { AdvancedDocumentSearchResult, DocumentDetail, LogicalLocation } from '../types/api';
import { HighlightSnippetList } from '../components/HighlightSnippetList';
import {
  FILE_HIGHLIGHT_SNIPPET_LIMIT,
  mergeFileHighlights,
  sanitizeHighlightHtml
} from '../lib/advancedSearchHighlights';

type Notice = {
  tone: 'success' | 'error';
  message: string;
};

type AdvancedSearchPageProps = {
  setNotice: (notice: Notice) => void;
  onGoToDocument?: (documentId: string) => void;
};

type PdfViewState = {
  open: boolean;
  maximized: boolean;
  blobUrl: string | null;
  fileName: string;
  isPdf: boolean;
};

type DetailCache = Record<string, { loading: boolean; data: DocumentDetail | null }>;

type LogicalLocationOption = {
  id: string;
  name: string;
  depth: number;
};

function flattenLogicalLocations(nodes: LogicalLocation[], depth = 0): LogicalLocationOption[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenLogicalLocations(node.children, depth + 1)
  ]);
}

export function AdvancedSearchPage({ setNotice, onGoToDocument }: AdvancedSearchPageProps) {
  const { logout } = useAuth();
  const theme = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<AdvancedDocumentSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [logicalLocationOptions, setLogicalLocationOptions] = useState<LogicalLocationOption[]>([]);
  const [selectedLogicalLocationId, setSelectedLogicalLocationId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<DetailCache>({});
  const [pdfView, setPdfView] = useState<PdfViewState>({ open: false, maximized: false, blobUrl: null, fileName: '', isPdf: true });
  const [expandedFileHighlights, setExpandedFileHighlights] = useState<Record<string, boolean>>({});

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
  const isImageFileName = (fileName: string) => imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));

  const displayResults = useMemo(
    () => results.map((item) => ({
      ...item,
      highlights: (item.highlights || []).map(sanitizeHighlightHtml),
      fileHighlights: mergeFileHighlights(item.fileIds, item.fileNames, item.fileHighlights || []).map((file) => ({
        ...file,
        highlights: file.highlights.map(sanitizeHighlightHtml)
      }))
    })),
    [results]
  );

  useEffect(() => {
    setExpandedFileHighlights({});
  }, [results]);

  useEffect(() => {
    let isCancelled = false;

    void api
      .getMyBuildings()
      .then((tree) => {
        if (isCancelled) return;
        const flattened = flattenLogicalLocations(tree);
        setLogicalLocationOptions(flattened);
        setSelectedLogicalLocationId((current) => {
          if (current && flattened.some((item) => item.id === current)) {
            return current;
          }
          return flattened[0]?.id || '';
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        const message = error instanceof Error ? error.message : 'Məntiqi yerləşdirmələr yüklənmədi.';
        setNotice({ tone: 'error', message });
      });

    return () => {
      isCancelled = true;
    };
  }, [setNotice]);

  useEffect(() => {
    if (!searchQuery.trim() || !selectedLogicalLocationId) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    void api
      .advancedSearchDocuments({
        page: page + 1,
        pageSize,
        query: searchQuery,
        logicalLocationId: selectedLogicalLocationId
      })
      .then((response) => {
        if (isCancelled) return;
        setResults(response.items);
        setTotalCount(response.totalCount);
      })
      .catch((error) => {
        if (isCancelled) return;
        const message = error instanceof Error ? error.message : 'Axtarış nəticələri yüklənmədi.';
        setNotice({ tone: 'error', message });
        if (message.includes('Unauthorized')) logout();
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [logout, page, pageSize, searchQuery, selectedLogicalLocationId, setNotice]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchInput.trim();

    if (!trimmed) {
      setNotice({ tone: 'error', message: 'Axtarış üçün mətn daxil edin.' });
      return;
    }

    if (!selectedLogicalLocationId) {
      setNotice({ tone: 'error', message: 'Məntiqi yerləşdirmə seçilməsi tələb olunur.' });
      return;
    }

    setHasSearched(true);

    if (trimmed === searchQuery) {
      setPage(0);
      return;
    }

    setPage(0);
    setSearchQuery(trimmed);
  }

  function handleToggleExpand(documentId: string) {
    if (expandedId === documentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(documentId);
    if (!detailCache[documentId]) {
      setDetailCache((prev) => ({ ...prev, [documentId]: { loading: true, data: null } }));
      void api
        .getDocumentDetail(documentId)
        .then((detail) => setDetailCache((prev) => ({ ...prev, [documentId]: { loading: false, data: detail } })))
        .catch(() => setDetailCache((prev) => ({ ...prev, [documentId]: { loading: false, data: null } })));
    }
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      const { blob, fileName: dlName } = await api.downloadDocumentFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dlName || fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ tone: 'error', message: 'Fayl yüklənmədi.' });
    }
  }

  async function handleFilePreview(fileId: string, fileName: string, isPdf: boolean) {
    try {
      const { blob } = await api.downloadDocumentFile(fileId);
      if (pdfView.blobUrl) URL.revokeObjectURL(pdfView.blobUrl);
      const url = URL.createObjectURL(blob);
      setPdfView({ open: true, maximized: false, blobUrl: url, fileName, isPdf });
    } catch {
      setNotice({ tone: 'error', message: 'Fayl önizləməsi göstərilərkən xəta baş verdi.' });
    }
  }

  function closePdf() {
    if (pdfView.blobUrl) URL.revokeObjectURL(pdfView.blobUrl);
    setPdfView({ open: false, maximized: false, blobUrl: null, fileName: '', isPdf: true });
  }


  return (
    <Stack spacing={2.5}>

      {/* ══ HERO SEARCH BANNER ══════════════════════════════════════ */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`,
          borderRadius: 0,
          px: { xs: 3, md: 5 },
          pt: { xs: 3.5, md: 4.5 },
          pb: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration circles */}
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: alpha('#fff', 0.05), pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -60, right: 80, width: 140, height: 140, borderRadius: '50%', bgcolor: alpha('#fff', 0.04), pointerEvents: 'none' }} />

        <Stack spacing={2.5} sx={{ position: 'relative' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ManageSearchRounded sx={{ color: alpha('#fff', 0.9), fontSize: 28 }} />
            <Stack spacing={0}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
                Məzmun üzrə axtarış
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                Sənəd fayllarının OCR məzmunində tam mətn axtarışı
              </Typography>
            </Stack>
          </Stack>

          <Box component="form" onSubmit={handleSearchSubmit}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
              <TextField
                select
                variant="filled"
                label="Məntiqi yerləşdirmə"
                value={selectedLogicalLocationId}
                onChange={(event) => {
                  setSelectedLogicalLocationId(event.target.value);
                  setPage(0);
                }}
                InputProps={{ disableUnderline: true }}
                sx={{
                  minWidth: { xs: '100%', md: 280 },
                  '& .MuiFilledInput-root': {
                    bgcolor: alpha('#fff', 0.12),
                    borderRadius: 1,
                    color: '#fff',
                    '&:hover': { bgcolor: alpha('#fff', 0.18) },
                    '&.Mui-focused': { bgcolor: alpha('#fff', 0.18) },
                  },
                  '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) },
                  '& .MuiInputLabel-root.Mui-focused': { color: alpha('#fff', 0.9) },
                  '& .MuiFilledInput-input': { color: '#fff' },
                }}
                required
              >
                {logicalLocationOptions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {'\u00A0'.repeat(item.depth * 2)}{item.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                variant="filled"
                label="Açar söz daxil edin"
                placeholder="Məsələn: müqavilə müddəti, sifariş kodu, təhvil aktı"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                InputProps={{ disableUnderline: true }}
                sx={{
                  '& .MuiFilledInput-root': {
                    bgcolor: alpha('#fff', 0.12),
                    borderRadius: 1,
                    color: '#fff',
                    '&:hover': { bgcolor: alpha('#fff', 0.18) },
                    '&.Mui-focused': { bgcolor: alpha('#fff', 0.18) },
                  },
                  '& .MuiInputLabel-root': { color: alpha('#fff', 0.7) },
                  '& .MuiInputLabel-root.Mui-focused': { color: alpha('#fff', 0.9) },
                  '& .MuiFilledInput-input': { color: '#fff' },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <SearchRounded />}
                disabled={isLoading}
                sx={{
                  minWidth: { md: 160 },
                  height: 56,
                  px: 3,
                  bgcolor: '#fff',
                  color: 'primary.main',
                  fontWeight: 700,
                  borderRadius: 1,
                  flexShrink: 0,
                  boxShadow: `0 4px 14px ${alpha('#000', 0.2)}`,
                  '&:hover': { bgcolor: alpha('#fff', 0.9) },
                  '&:disabled': { bgcolor: alpha('#fff', 0.4), color: alpha(theme.palette.primary.main, 0.5) }
                }}
              >
                Axtar
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* ══ RESULTS PANEL ══════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>

        {/* Panel header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <FolderOpenRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={700}>Axtarış nəticələri</Typography>
          </Stack>
          {hasSearched && (
            <Chip
              size="small"
              label={`${totalCount} sənəd`}
              sx={{
                bgcolor: totalCount > 0 ? alpha(theme.palette.primary.main, 0.1) : 'grey.200',
                color: totalCount > 0 ? 'primary.main' : 'text.secondary',
                fontWeight: 700,
                border: 'none',
              }}
            />
          )}
        </Stack>

        {/* Body */}
        {isLoading ? (
          <Box>
            <LinearProgress sx={{ height: 2 }} />
            <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8 }}>
              <CircularProgress size={32} thickness={3} />
              <Typography variant="body2" color="text.secondary">Axtarılır…</Typography>
            </Stack>
          </Box>
        ) : !hasSearched ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 10 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ManageSearchRounded sx={{ fontSize: 36, color: 'primary.main', opacity: 0.6 }} />
            </Box>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Axtarışa başlayın</Typography>
              <Typography variant="caption" color="text.disabled" textAlign="center" sx={{ maxWidth: 320 }}>
                Yuxarıdakı sahəyə açar söz daxil edin — sənəd fayllarının OCR mətnindən nəticələr göstəriləcək.
              </Typography>
            </Stack>
          </Stack>
        ) : displayResults.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 10 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: 'grey.100',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <SearchRounded sx={{ fontSize: 36, color: 'text.disabled' }} />
            </Box>
            <Stack alignItems="center" spacing={0.5}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Nəticə tapılmadı</Typography>
              <Typography variant="caption" color="text.disabled">Başqa açar söz ilə yenidən cəhd edin.</Typography>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={0}>
            {displayResults.map((item, index) => {
              const isExpanded = expandedId === item.documentId;
              const cache = detailCache[item.documentId];
              const detail = cache?.data;
              const scoreColor = item.score >= 1.0
                ? theme.palette.success.main
                : item.score >= 0.5
                  ? theme.palette.warning.main
                  : theme.palette.text.disabled;
              const scorePct = Math.min(100, Math.round(item.score * 50));

              return (
                <Box
                  key={item.documentId}
                  sx={{
                    borderBottom: index < results.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                  }}
                >
                  {/* ─ Card header ─── */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    sx={{ px: 2.5, pt: 2, pb: item.fileHighlights.length > 0 || item.highlights.length > 0 ? 1 : 2 }}
                  >
                    {/* Score indicator */}
                    <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 44 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                        #{index + 1 + page * pageSize}
                      </Typography>
                      <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'grey.200', overflow: 'hidden' }}>
                        <Box sx={{ width: `${scorePct}%`, height: '100%', bgcolor: scoreColor, borderRadius: 2 }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1 }}>
                        {item.score.toFixed(2)}
                      </Typography>
                    </Stack>

                    {/* Title */}
                    <Stack spacing={0.3} sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                        {item.title}
                      </Typography>
                      {item.baseDocumentNumber && (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" color="text.disabled">Qərar:</Typography>
                          <Chip
                            size="small"
                            label={item.baseDocumentNumber}
                            sx={{ height: 18, fontSize: '0.68rem', bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.dark', border: 'none' }}
                          />
                        </Stack>
                      )}
                    </Stack>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.75} alignItems="center" flexShrink={0}>
                      {onGoToDocument && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<OpenInNewRounded sx={{ fontSize: '14px !important' }} />}
                          onClick={() => onGoToDocument(item.documentId)}
                          sx={{ borderRadius: 1, fontSize: '0.72rem', fontWeight: 700, px: 1.5, py: 0.5, boxShadow: 'none', '&:hover': { boxShadow: 1 } }}
                        >
                          Sənədə keç
                        </Button>
                      )}
                      <Tooltip title={isExpanded ? 'Detalları gizlət' : 'Detalları göstər'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(item.documentId)}
                          sx={{
                            border: '1px solid',
                            borderColor: isExpanded ? 'primary.main' : 'divider',
                            color: isExpanded ? 'primary.main' : 'text.secondary',
                            borderRadius: 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          <ExpandMoreRounded
                            fontSize="small"
                            sx={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}
                          />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {item.highlights.length > 0 && (
                    <HighlightSnippetList
                      snippets={item.highlights}
                      typographyVariant="body2"
                      sx={{ px: 2.5, pb: 1.5 }}
                      testIdPrefix={`top-highlight-${item.documentId}`}
                    />
                  )}

                  {/* ─ File chips ─── */}
                  {item.fileIds.length > 0 && (
                    <Stack spacing={1} sx={{ px: 2.5, pb: 1.75 }}>
                      {item.fileHighlights.map((file) => {
                        const fileName = file.fileName;
                        const fileId = file.fileId;
                        const isPdf = fileName.toLowerCase().endsWith('.pdf');
                        const isImage = isImageFileName(fileName);
                        const isPreviewable = isPdf || isImage;
                        const fileHighlightKey = `${item.documentId}:${fileId}`;
                        const isFileExpanded = Boolean(expandedFileHighlights[fileHighlightKey]);

                        return (
                          <Box
                            key={fileId}
                            sx={{
                              border: '1px solid',
                              borderColor: file.highlights.length > 0 ? alpha(theme.palette.primary.main, 0.2) : isPdf ? alpha(theme.palette.error.main, 0.3) : 'divider',
                              borderRadius: 1,
                              bgcolor: file.highlights.length > 0 ? alpha(theme.palette.primary.main, 0.03) : isPdf ? alpha(theme.palette.error.main, 0.04) : 'grey.50',
                              overflow: 'hidden',
                              transition: 'border-color 0.15s',
                              '&:hover': { borderColor: isPdf ? 'error.light' : 'primary.light' },
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ pl: 1, pr: 0, py: 0.5 }}>
                              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, pr: 0.75 }}>
                                {isPdf
                                  ? <PictureAsPdfRounded sx={{ fontSize: 14, color: 'error.main' }} />
                                  : <InsertDriveFileOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />}
                                <Typography variant="caption" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {fileName}
                                </Typography>
                              </Stack>
                              <Stack direction="row" sx={{ borderLeft: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                                {isPreviewable && (
                                  <Tooltip title="Öncədən bax">
                                    <IconButton
                                      size="small"
                                      onClick={() => void handleFilePreview(fileId, fileName, isPdf)}
                                      sx={{ borderRadius: 0, px: 0.75, py: 0.5, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}
                                    >
                                      <VisibilityRounded sx={{ fontSize: 13, color: 'error.main' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Yüklə">
                                  <IconButton
                                    size="small"
                                    onClick={() => void handleDownload(fileId, fileName)}
                                    sx={{
                                      borderRadius: 0,
                                      px: 0.75,
                                      py: 0.5,
                                      borderLeft: isPreviewable ? '1px solid' : 'none',
                                      borderColor: 'divider',
                                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                    }}
                                  >
                                    <DownloadRounded sx={{ fontSize: 13, color: 'primary.main' }} />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>

                            {file.highlights.length > 0 ? (
                              <Stack spacing={0.5} sx={{ px: 1, pb: 1, pt: 0.25 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.disabled',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.35
                                  }}
                                >
                                  OCR uyğunluqları
                                </Typography>
                                <HighlightSnippetList
                                  snippets={file.highlights}
                                  expanded={isFileExpanded}
                                  limit={FILE_HIGHLIGHT_SNIPPET_LIMIT}
                                  onToggle={() =>
                                    setExpandedFileHighlights((current) => ({
                                      ...current,
                                      [fileHighlightKey]: !current[fileHighlightKey]
                                    }))
                                  }
                                  testIdPrefix={`file-highlight-${item.documentId}-${fileId}`}
                                />
                              </Stack>
                            ) : null}
                          </Box>
                        );
                      })}
                    </Stack>
                  )}

                  {/* ─ Expandable detail ─── */}
                  <Collapse in={isExpanded} unmountOnExit>
                    <Box sx={{ mx: 2.5, mb: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2), borderRadius: 1, overflow: 'hidden', bgcolor: alpha(theme.palette.primary.main, 0.015) }}>
                      {cache?.loading ? (
                        <Stack alignItems="center" spacing={1} py={3}>
                          <CircularProgress size={22} thickness={3} />
                          <Typography variant="caption" color="text.secondary">Detallar yüklənir…</Typography>
                        </Stack>
                      ) : !detail ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
                          <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">Detallar yüklənmədi.</Typography>
                        </Stack>
                      ) : (
                        <Stack spacing={0} divider={<Divider />}>
                          {/* Metadata */}
                          <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                            <AccordionSummary
                              expandIcon={<ExpandMoreRounded sx={{ fontSize: 18 }} />}
                              sx={{ minHeight: 44, px: 2, '& .MuiAccordionSummary-content': { my: 0 }, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                            >
                              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Ümumi məlumat
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                                {[
                                  { label: 'Sənəd növü', value: detail.documentTypeName },
                                  { label: 'Status', value: detail.status },
                                  { label: 'Yaradılma tarixi', value: new Date(detail.createdDate).toLocaleString('az-AZ') },
                                  { label: 'Bitmə tarixi', value: detail.expirationDate ? new Date(detail.expirationDate).toLocaleDateString('az-AZ') : '—' },
                                  { label: 'Arxivlənmə tarixi', value: detail.archivedDate ? new Date(detail.archivedDate).toLocaleDateString('az-AZ') : '—' },
                                  { label: 'Fiziki yerləşdirmə', value: detail.physicalLocationName ?? '—' },
                                ].map(({ label, value }) => (
                                  <Stack key={label} spacing={0.15}>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                                  </Stack>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>

                          {/* References */}
                          {detail.references.length > 0 && (
                            <Accordion disableGutters elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                              <AccordionSummary
                                expandIcon={<ExpandMoreRounded sx={{ fontSize: 18 }} />}
                                sx={{ minHeight: 44, px: 2, '& .MuiAccordionSummary-content': { my: 0 }, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    İstinad sahələri
                                  </Typography>
                                  <Chip size="small" label={detail.references.length} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} />
                                </Stack>
                              </AccordionSummary>
                              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                                  {detail.references.map((ref) => (
                                    <Stack key={ref.referenceId} spacing={0.15}>
                                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{ref.referenceName}</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{ref.value || '—'}</Typography>
                                    </Stack>
                                  ))}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </Stack>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        )}

        {hasSearched && totalCount > 0 && (
          <>
            <Divider />
            <TablePagination
              component="div"
              labelRowsPerPage="Səhifə üzrə sətir sayı:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count !== -1 ? count : `>${to}`}`}
              count={totalCount}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </Paper>

      {/* ══ PDF DIALOG (maximized) ══════════════════════════════════ */}
      <Dialog
        open={pdfView.open && pdfView.maximized}
        onClose={() => setPdfView((s) => ({ ...s, maximized: false }))}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 0 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {pdfView.isPdf ? <PictureAsPdfRounded color="error" sx={{ fontSize: 20 }} /> : <InsertDriveFileOutlined color="action" sx={{ fontSize: 20 }} />}
            <Typography variant="subtitle1" fontWeight={600}>{pdfView.fileName}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Kiçilt">
              <IconButton size="small" onClick={() => setPdfView((s) => ({ ...s, maximized: false }))}><FullscreenExitRounded /></IconButton>
            </Tooltip>
            <Tooltip title="Bağla">
              <IconButton size="small" onClick={closePdf}><CloseRounded /></IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ flex: 1, p: 0, display: 'flex' }}>
          {pdfView.isPdf ? (
            <iframe src={pdfView.blobUrl ?? undefined} title={pdfView.fileName} style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.100' }}>
              <img src={pdfView.blobUrl ?? undefined} alt={pdfView.fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ PDF INLINE PANEL (non-maximized) ═══════════════════════ */}
      {pdfView.open && !pdfView.maximized && pdfView.blobUrl && (
        <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              px: 2, py: 1,
              background: `linear-gradient(90deg, ${alpha(theme.palette.error.main, 0.06)} 0%, transparent 100%)`,
              borderBottom: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.2)
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {pdfView.isPdf ? <PictureAsPdfRounded sx={{ fontSize: 16, color: 'error.main' }} /> : <InsertDriveFileOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />}
              <Typography variant="body2" fontWeight={600}>{pdfView.fileName}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Tam ekrana aç">
                <IconButton size="small" onClick={() => setPdfView((s) => ({ ...s, maximized: true }))}><FullscreenRounded fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Bağla">
                <IconButton size="small" onClick={closePdf}><CloseRounded fontSize="small" /></IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          <Box sx={{ height: 540 }}>
            {pdfView.isPdf ? (
              <iframe src={pdfView.blobUrl} title={pdfView.fileName} style={{ width: '100%', height: '100%', border: 'none' }} />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.100' }}>
                <img src={pdfView.blobUrl} alt={pdfView.fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Stack>
  );
}
