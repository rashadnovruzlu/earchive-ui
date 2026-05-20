import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import TopicRounded from '@mui/icons-material/TopicRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import DocumentScannerRounded from '@mui/icons-material/DocumentScannerRounded';
import ScannerRounded from '@mui/icons-material/ScannerRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import ArchiveRounded from '@mui/icons-material/ArchiveRounded';
import CompareArrowsRounded from '@mui/icons-material/CompareArrowsRounded';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import FullscreenRounded from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import type {
  BaseDocument,
  Document,
  DocumentFile,
  DocumentMovement,
  DocumentType,
  LogicalLocation,
  OrgStructureNode,
  PhysicalLocation,
  ReferenceRecord,
  SetReferenceValuePayload
} from '../types/api';
import { api } from '../lib/api';
import { useAuth } from '../features/auth/AuthProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Notice = {
  tone: 'success' | 'error';
  message: string;
};

type DocumentFormState = {
  id?: string;
  title: string;
  documentTypeId: string;
  baseDocumentId: string;
  physicalLocationId: string;
  expirationDate: string;
  qrCodeKey: string;
  references: Record<string, string>;
};

type BaseDocumentOption = Pick<BaseDocument, 'id' | 'documentNumber' | 'description'>;

type DocumentFilesDialogState = {
  documentId: string | null;
  files: DocumentFile[];
  isLoading: boolean;
  pdfPreviewFileId: string | null;
  pdfBlobUrl: string | null;
  pdfMaximized: boolean;
};

type ArchiveDialogState = {
  open: boolean;
  documentId: string | null;
  physicalLocationId: string;
};

type DocumentFileUploadState = {
  files: File[];
  isOriginal: boolean;
};

type MovementFormState = {
  organizationalStructureId: number | '';
  notes: string;
};

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml'
]);

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];

const dwtScriptUrl = 'https://cdn.jsdelivr.net/npm/dwt@19.3.3/dist/dynamsoft.webtwain.min.js';
const dwtDefaultResourcesPath = 'https://cdn.jsdelivr.net/npm/dwt@19.3.3/dist';
const dwtDefaultServiceInstallerLocation = 'https://unpkg.com/dwt@19.3.3/dist/dist/';
const dwtInstanceId = 'documents-page-dwt-instance';
const dwtDemoProductKey = 'DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9';
const dwtReadyTimeoutMs = 8000;

let dwtReadyPromise: Promise<any> | null = null;

function getDynamsoftNamespace() {
  return (window as Window & { Dynamsoft?: any }).Dynamsoft;
}

function loadDwtScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Brauzer mühiti mövcud deyil.'));
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${dwtScriptUrl}"]`);
    if (existingScript) {
      if ((window as Window & { Dynamsoft?: any }).Dynamsoft?.DWT) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Dynamsoft Web TWAIN skripti yüklənmədi.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = dwtScriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Dynamsoft Web TWAIN skripti yüklənmədi.'));
    document.head.appendChild(script);
  });
}

async function ensureDwtInstance(productKey: string) {
  if (dwtReadyPromise) {
    return dwtReadyPromise;
  }

  dwtReadyPromise = new Promise<any>(async (resolve, reject) => {
    try {
      await loadDwtScript();

      const dynamsoft = getDynamsoftNamespace();
      const dwt = dynamsoft?.DWT;

      if (!dwt) {
        throw new Error('Dynamsoft Web TWAIN başlatıla bilmədi.');
      }

      dwt.ResourcesPath = import.meta.env.VITE_DWT_RESOURCES_PATH || dwtDefaultResourcesPath;
      dwt.ServiceInstallerLocation = import.meta.env.VITE_DWT_SERVICE_INSTALLER_LOCATION || dwtDefaultServiceInstallerLocation;
      dwt.ProductKey = productKey;
      dwt.AutoLoad = false;
      dwt.Containers = [];
      dwt.UseDefaultViewer = false;
      dwt.IfCheckCORS = true;

      const existingInstance = dwt.GetWebTwain?.(dwtInstanceId);
      if (existingInstance) {
        resolve(existingInstance);
        return;
      }

      const timeoutId = window.setTimeout(() => {
        dwtReadyPromise = null;
        reject(new Error('Web TWAIN xidməti tapılmadı. Səhifə işləməyə davam edir, amma skan üçün Dynamsoft servisinin quraşdırılması tələb olunur.'));
      }, dwtReadyTimeoutMs);

      dwt.CreateDWTObjectEx(
        {
          WebTwainId: dwtInstanceId
        },
        (instance: any) => {
          window.clearTimeout(timeoutId);
          resolve(instance);
        },
        (error: { code?: number; message?: string }) => {
          window.clearTimeout(timeoutId);
          dwtReadyPromise = null;
          reject(new Error(error?.message || 'Web TWAIN xidməti başladılmadı.'));
        }
      );
    } catch (error) {
      dwtReadyPromise = null;
      reject(error);
    }
  });

  return dwtReadyPromise;
}

function convertScannedPagesToPdfFile(webTwain: any, imageTypeEnum: any, startIndex: number) {
  const totalImages = Number(webTwain.HowManyImagesInBuffer ?? 0);
  const indices = Array.from({ length: Math.max(0, totalImages - startIndex) }, (_, index) => startIndex + index);

  if (indices.length === 0) {
    return Promise.reject(new Error('Heç bir səhifə skan edilmədi.'));
  }

  return new Promise<File>((resolve, reject) => {
    webTwain.ConvertToBlob(
      indices,
      imageTypeEnum.IT_PDF,
      (blob: Blob) => {
        const fileName = `scan-${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
        resolve(new File([blob], fileName, { type: 'application/pdf', lastModified: Date.now() }));
      },
      (_errorCode: number, errorString: string) => reject(new Error(errorString || 'Skan edilmiş fayl PDF-ə çevrilmədi.'))
    );
  });
}

function isImageFile(mimeType: string, fileName: string) {
  const lowerName = fileName.toLowerCase();
  return imageMimeTypes.has(mimeType.toLowerCase()) || imageExtensions.some((ext) => lowerName.endsWith(ext));
}

type ConfirmDeleteState = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (() => Promise<void>) | null;
};

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

const emptyDocumentForm = (): DocumentFormState => ({
  title: '',
  documentTypeId: '',
  baseDocumentId: '',
  physicalLocationId: '',
  expirationDate: '',
  qrCodeKey: '',
  references: {}
});

const appendSelectedFiles = (currentFiles: File[], incomingFiles: File[]) => {
  const fileMap = new Map(currentFiles.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]));

  for (const file of incomingFiles) {
    fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  }

  return Array.from(fileMap.values());
};

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '4px',
        p: 4,
        textAlign: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {body}
      </Typography>
    </Box>
  );
}

export function DocumentsPage({
  isBusy,
  runAction,
  setNotice
}: {
  isBusy: boolean;
  runAction: (action: () => Promise<void>, successMessage: string) => Promise<void>;
  setNotice: (notice: Notice | null) => void;
}) {
  const { logout } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsTotal, setDocumentsTotal] = useState(0);
  const [documentPage, setDocumentPage] = useState(0);
  const [documentPageSize, setDocumentPageSize] = useState(20);
  const [documentSearchInput, setDocumentSearchInput] = useState('');
  const [documentQuery, setDocumentQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [baseDocuments, setBaseDocuments] = useState<BaseDocument[]>([]);
  const [physicalLocations, setPhysicalLocations] = useState<PhysicalLocation[]>([]);
  const [logicalLocationOptions, setLogicalLocationOptions] = useState<LogicalLocationOption[]>([]);
  const [selectedLogicalLocationId, setSelectedLogicalLocationId] = useState('');
  const [referenceDefinitions, setReferenceDefinitions] = useState<ReferenceRecord[]>([]);
  const [baseDocumentSearchInput, setBaseDocumentSearchInput] = useState('');
  const [baseDocumentLoading, setBaseDocumentLoading] = useState(false);
  const [baseDocumentPage, setBaseDocumentPage] = useState(1);
  const [baseDocumentPageSize] = useState(20);
  const [baseDocumentTotalCount, setBaseDocumentTotalCount] = useState(0);
  const [baseDocumentLastSearchQuery, setBaseDocumentLastSearchQuery] = useState('');

  const [documentFormOpen, setDocumentFormOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(emptyDocumentForm);
  const [documentSubmitLoading, setDocumentSubmitLoading] = useState(false);
  const [documentFormUpload, setDocumentFormUpload] = useState<DocumentFileUploadState>({ files: [], isOriginal: true });
  const [documentScanLoading, setDocumentScanLoading] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanDialogStatus, setScanDialogStatus] = useState<'idle' | 'connecting' | 'ready' | 'scanning' | 'done' | 'error'>('idle');
  const [scanDialogError, setScanDialogError] = useState<string | null>(null);
  const [scanDialogPageCount, setScanDialogPageCount] = useState(0);
  const dwtRef = useRef<any>(null);
  const [documentFormExistingFiles, setDocumentFormExistingFiles] = useState<DocumentFile[]>([]);
  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [movementTargetDocument, setMovementTargetDocument] = useState<Document | null>(null);
  const [movementForm, setMovementForm] = useState<MovementFormState>({ organizationalStructureId: '', notes: '' });
  const [orgStructureNodes, setOrgStructureNodes] = useState<Array<{ id: number; name: string; depth: number }>>([]);
  const [movementHistoryByDocumentId, setMovementHistoryByDocumentId] = useState<Record<string, DocumentMovement[]>>({});
  const [loadingMovementHistoryForId, setLoadingMovementHistoryForId] = useState<string | null>(null);

  const [archiveDialog, setArchiveDialog] = useState<ArchiveDialogState>({
    open: false,
    documentId: null,
    physicalLocationId: ''
  });

  const [filesDialog, setFilesDialog] = useState<DocumentFilesDialogState>({
    documentId: null,
    files: [],
    isLoading: false,
    pdfPreviewFileId: null,
    pdfBlobUrl: null,
    pdfMaximized: false
  });
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const openDeleteConfirm = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setConfirmDelete({ open: true, title, message, onConfirm });
  };

  const dwtProductKey = (import.meta.env.VITE_DWT_PRODUCT_KEY || dwtDemoProductKey).trim();

  const openScanDialog = useCallback(() => {
    setScanDialogOpen(true);
    setScanDialogStatus('connecting');
    setScanDialogError(null);
    setScanDialogPageCount(0);

    ensureDwtInstance(dwtProductKey)
      .then((instance) => {
        dwtRef.current = instance;
        setScanDialogStatus('ready');
      })
      .catch((err: unknown) => {
        dwtRef.current = null;
        setScanDialogError(err instanceof Error ? err.message : 'Skan xidməti başladılmadı.');
        setScanDialogStatus('error');
      });
  }, [dwtProductKey]);

  function closeScanDialog() {
    setScanDialogOpen(false);
    setScanDialogStatus('idle');
    setScanDialogError(null);
    setScanDialogPageCount(0);
    setDocumentScanLoading(false);
  }

  async function handleScanFromScanner() {
    const webTwain = dwtRef.current;
    const dwt = getDynamsoftNamespace()?.DWT;

    if (!webTwain || !dwt?.EnumDWT_ImageType) return;

    setScanDialogStatus('scanning');
    setDocumentScanLoading(true);

    try {
      const startIndex = Number(webTwain.HowManyImagesInBuffer ?? 0);

      await webTwain.SelectSourceAsync();
      await webTwain.AcquireImageAsync({
        IfShowUI: true,
        Resolution: 300,
        IfCloseSourceAfterAcquire: true,
        IfDisableSourceAfterAcquire: true
      });

      const newPageCount = Number(webTwain.HowManyImagesInBuffer ?? 0) - startIndex;
      setScanDialogPageCount(newPageCount);

      if (newPageCount > 0) {
        const scannedFile = await convertScannedPagesToPdfFile(webTwain, dwt.EnumDWT_ImageType, startIndex);
        setDocumentFormUpload((current) => ({
          ...current,
          files: appendSelectedFiles(current.files, [scannedFile])
        }));
        setScanDialogStatus('done');
      } else {
        setScanDialogStatus('ready');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Skan zamanı naməlum xəta baş verdi.';
      setScanDialogError(message);
      setScanDialogStatus('error');
    } finally {
      setDocumentScanLoading(false);
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete.onConfirm) return;
    setConfirmingDelete(true);
    try {
      await confirmDelete.onConfirm();
    } finally {
      setConfirmingDelete(false);
      setConfirmDelete({ open: false, title: '', message: '', onConfirm: null });
    }
  };

  const selectedDocumentTypeName = useMemo(
    () => documentTypes.find((item) => item.id === documentForm.documentTypeId)?.name || '',
    [documentTypes, documentForm.documentTypeId]
  );

  const baseDocumentOptions = useMemo<BaseDocumentOption[]>(
    () => baseDocuments.map((item) => ({ id: item.id, documentNumber: item.documentNumber, description: item.description || '' })),
    [baseDocuments]
  );

  const baseDocumentValue = useMemo<BaseDocumentOption | null>(() => {
    if (!documentForm.baseDocumentId) return null;
    return baseDocumentOptions.find((item) => item.id === documentForm.baseDocumentId) || {
      id: documentForm.baseDocumentId,
      documentNumber: baseDocumentSearchInput || documentForm.baseDocumentId,
      description: ''
    };
  }, [baseDocumentOptions, baseDocumentSearchInput, documentForm.baseDocumentId]);

  const physicalLocationOptions = useMemo(
    () =>
      physicalLocations.map((location) => ({
        ...location,
        logicalPath: location.logicalLocationName || ''
      })),
    [physicalLocations]
  );

  async function loadDocuments() {
    if (!selectedLogicalLocationId) {
      setDocuments([]);
      setDocumentsTotal(0);
      return;
    }

    setIsDocumentsLoading(true);

    try {
      const pageResult = await api.searchDocuments({
        page: documentPage + 1,
        pageSize: documentPageSize,
        logicalLocationId: selectedLogicalLocationId,
        documentTypeId: documentTypeFilter || undefined,
        title: documentQuery || undefined
      });
      setDocuments(pageResult.items);
      setDocumentsTotal(pageResult.totalCount);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sənədlər yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) logout();
    } finally {
      setIsDocumentsLoading(false);
    }
  }

  async function loadOptions() {
    try {
      const [docTypes, locations, logicalHierarchy] = await Promise.all([
        api.getDocumentTypes(),
        api.getPhysicalLocations(),
        api.getMyBuildings()
      ]);

      setDocumentTypes(docTypes);
      setPhysicalLocations(locations);
      const flattenedLogicalLocations = flattenLogicalLocations(logicalHierarchy);
      setLogicalLocationOptions(flattenedLogicalLocations);
      setSelectedLogicalLocationId((current) => {
        if (current && flattenedLogicalLocations.some((item) => item.id === current)) {
          return current;
        }
        return flattenedLogicalLocations[0]?.id || '';
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Siyahı məlumatları yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) logout();
    }
  }

  useEffect(() => {
    void loadDocuments();
  }, [documentPage, documentPageSize, documentQuery, selectedLogicalLocationId, documentTypeFilter]);

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBaseDocumentPage(1);
      setBaseDocumentLastSearchQuery(baseDocumentSearchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [baseDocumentSearchInput]);

  useEffect(() => {
    if (!documentFormOpen) {
      return;
    }

    setBaseDocumentLoading(true);
    void api
      .searchBaseDocuments({ page: baseDocumentPage, pageSize: baseDocumentPageSize, documentNumber: baseDocumentLastSearchQuery || undefined })
      .then((result) => {
        if (baseDocumentPage === 1) {
          setBaseDocuments(result.items);
        } else {
          setBaseDocuments((current) => [...current, ...result.items]);
        }
        setBaseDocumentTotalCount(result.totalCount);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Qərar sənədləri yüklənmədi.';
        setNotice({ tone: 'error', message });
        if (message.includes('Unauthorized')) logout();
      })
      .finally(() => setBaseDocumentLoading(false));
  }, [baseDocumentPage, baseDocumentPageSize, baseDocumentLastSearchQuery, documentFormOpen, logout, setNotice]);

  useEffect(() => {
    return () => {
      setFilesDialog((current) => {
        if (current.pdfBlobUrl) {
          URL.revokeObjectURL(current.pdfBlobUrl);
        }
        return current;
      });
    };
  }, []);

  useEffect(() => {
    if (!movementFormOpen) return;
    void (async () => {
      try {
        const tree = await api.getOrgStructureTree();
        const flatten = (nodes: OrgStructureNode[], depth = 0): Array<{ id: number; name: string; depth: number }> =>
          nodes.flatMap((n) => [{ id: n.id, name: n.name, depth }, ...flatten(n.children, depth + 1)]);
        setOrgStructureNodes(flatten(tree));
      } catch {
        setOrgStructureNodes([]);
      }
    })();
  }, [movementFormOpen]);

  async function refreshDocuments() {
    await loadDocuments();
  }

  async function loadReferenceDefinitions(documentTypeId: string, values: Record<string, string> = {}) {
    if (!documentTypeId) {
      setReferenceDefinitions([]);
      setDocumentForm((current) => ({ ...current, references: {} }));
      return;
    }

    try {
      const refs = await api.getReferencesByDocumentType(documentTypeId);
      setReferenceDefinitions(refs);
      setDocumentForm((current) => {
        const nextReferences: Record<string, string> = {};

        for (const ref of refs) {
          nextReferences[ref.id] = values[ref.id] || '';
        }

        return { ...current, references: nextReferences };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Referans sahələri yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) logout();
    }
  }

  const setReferenceValue = (referenceId: string, value: string) => {
    setDocumentForm((current) => ({
      ...current,
      references: {
        ...current.references,
        [referenceId]: value
      }
    }));
  };

  const getReferenceType = (columnType: string) => columnType.trim().toLowerCase();

  function renderReferenceInput(referenceField: ReferenceRecord) {
    const value = documentForm.references[referenceField.id] || '';
    const type = getReferenceType(referenceField.columnType);

    if (type === 'dropdown') {
      const sortedOptions = [...referenceField.options].sort((a, b) => a.displayOrder - b.displayOrder);
      const visibleOptions = sortedOptions.filter((option) => option.isActive || option.value === value);

      return (
        <FormControl key={referenceField.id} fullWidth required={referenceField.isRequired}>
          <InputLabel id={`reference-${referenceField.id}-label`}>{referenceField.name}</InputLabel>
          <Select
            labelId={`reference-${referenceField.id}-label`}
            label={referenceField.name}
            value={value}
            onChange={(event) => setReferenceValue(referenceField.id, String(event.target.value))}
          >
            <MenuItem value="">Seçin</MenuItem>
            {visibleOptions.map((option) => (
              <MenuItem key={`${referenceField.id}-${option.value}`} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (type === 'boolean') {
      return (
        <FormControl key={referenceField.id} fullWidth required={referenceField.isRequired}>
          <InputLabel id={`reference-${referenceField.id}-boolean-label`}>{referenceField.name}</InputLabel>
          <Select
            labelId={`reference-${referenceField.id}-boolean-label`}
            label={referenceField.name}
            value={value}
            onChange={(event) => setReferenceValue(referenceField.id, String(event.target.value))}
          >
            {!referenceField.isRequired ? <MenuItem value="">Seçin</MenuItem> : null}
            <MenuItem value="true">Bəli</MenuItem>
            <MenuItem value="false">Xeyr</MenuItem>
          </Select>
        </FormControl>
      );
    }

    if (type === 'date') {
      return (
        <TextField
          key={referenceField.id}
          label={referenceField.name}
          type="date"
          required={referenceField.isRequired}
          value={value}
          onChange={(event) => setReferenceValue(referenceField.id, event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      );
    }

    if (type === 'datetime') {
      return (
        <TextField
          key={referenceField.id}
          label={referenceField.name}
          type="datetime-local"
          required={referenceField.isRequired}
          value={value}
          onChange={(event) => setReferenceValue(referenceField.id, event.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      );
    }

    if (type === 'number') {
      return (
        <TextField
          key={referenceField.id}
          label={referenceField.name}
          type="number"
          required={referenceField.isRequired}
          value={value}
          onChange={(event) => setReferenceValue(referenceField.id, event.target.value)}
          fullWidth
        />
      );
    }

    if (type === 'decimal') {
      return (
        <TextField
          key={referenceField.id}
          label={referenceField.name}
          type="number"
          required={referenceField.isRequired}
          value={value}
          onChange={(event) => setReferenceValue(referenceField.id, event.target.value)}
          inputProps={{ step: 'any' }}
          fullWidth
        />
      );
    }

    return (
      <TextField
        key={referenceField.id}
        label={referenceField.name}
        required={referenceField.isRequired}
        value={value}
        onChange={(event) => setReferenceValue(referenceField.id, event.target.value)}
        fullWidth
      />
    );
  }

  function getReferencePayloads(): SetReferenceValuePayload[] {
    return referenceDefinitions
      .map((ref) => ({
        referenceId: ref.id,
        value: (documentForm.references[ref.id] || '').trim()
      }))
      .filter((item) => item.value.length > 0);
  }

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!documentForm.documentTypeId) {
      setNotice({ tone: 'error', message: 'Sənəd növü seçin.' });
      return;
    }

    setDocumentSubmitLoading(true);

    try {
      await runAction(async () => {
        const references = getReferencePayloads();

        if (documentForm.id) {
          const updated = await api.updateDocument(documentForm.id, {
            title: documentForm.title,
            baseDocumentId: documentForm.baseDocumentId || null,
            physicalLocationId: documentForm.physicalLocationId || null,
            expirationDate: documentForm.expirationDate || null,
            references
          });

          if (documentFormUpload.files.length > 0) {
            for (const file of documentFormUpload.files) {
              await api.uploadDocumentFile(updated.id, file, documentFormUpload.isOriginal);
            }
          }
        } else {
          const created = await api.createDocument({
            title: documentForm.title,
            documentTypeId: documentForm.documentTypeId,
            baseDocumentId: documentForm.baseDocumentId || null,
            physicalLocationId: documentForm.physicalLocationId || null,
            expirationDate: documentForm.expirationDate || null,
            references
          });

          if (documentFormUpload.files.length > 0) {
            for (const file of documentFormUpload.files) {
              await api.uploadDocumentFile(created.id, file, documentFormUpload.isOriginal);
            }
          }
        }

        setDocumentForm(emptyDocumentForm());
        setDocumentFormUpload({ files: [], isOriginal: true });
        setDocumentFormExistingFiles([]);
        setBaseDocumentSearchInput('');
        setBaseDocumentPage(1);
        setBaseDocumentLastSearchQuery('');
        setReferenceDefinitions([]);
        setDocumentFormOpen(false);
        await refreshDocuments();
      }, documentForm.id ? 'Sənəd yeniləndi.' : 'Sənəd və faylları yaradıldı.');
    } finally {
      setDocumentSubmitLoading(false);
    }
  }

  async function startEditingDocument(item: Document) {
    setDocumentFormOpen(true);

    try {
      const detail = await api.getDocumentDetail(item.id);
      const valueMap = detail.references.reduce<Record<string, string>>((acc, ref) => {
        acc[ref.referenceId] = ref.value || '';
        return acc;
      }, {});

      setDocumentForm({
        id: detail.id,
        title: detail.title,
        documentTypeId: detail.documentTypeId,
        baseDocumentId: detail.baseDocumentId || '',
        physicalLocationId: detail.physicalLocationId || '',
        expirationDate: detail.expirationDate ? new Date(detail.expirationDate).toISOString().slice(0, 10) : '',
        qrCodeKey: detail.qrCodeKey || '',
        references: valueMap
      });
      setDocumentFormExistingFiles(detail.files);
      setBaseDocumentSearchInput(detail.baseDocumentNumber || '');

      await loadReferenceDefinitions(detail.documentTypeId, valueMap);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sənəd detalları yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) logout();
    }
  }

  async function openDocumentFiles(item: Document) {
    if (filesDialog.documentId === item.id) {
      if (filesDialog.pdfBlobUrl) URL.revokeObjectURL(filesDialog.pdfBlobUrl);
      setFilesDialog({ documentId: null, files: [], isLoading: false, pdfPreviewFileId: null, pdfBlobUrl: null, pdfMaximized: false });
      return;
    }

    if (filesDialog.pdfBlobUrl) URL.revokeObjectURL(filesDialog.pdfBlobUrl);
    setFilesDialog({ documentId: item.id, files: [], isLoading: true, pdfPreviewFileId: null, pdfBlobUrl: null, pdfMaximized: false });

    try {
      const detail = await api.getDocumentDetail(item.id);
      setFilesDialog((current) => ({ ...current, files: detail.files, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fayllar yüklənmədi.';
      setNotice({ tone: 'error', message });
      setFilesDialog((current) => ({ ...current, isLoading: false }));
      if (message.includes('Unauthorized')) logout();
    }
  }

  async function handleDocumentFileDownload(fileId: string, fileName: string) {
    try {
      const { blob, fileName: downloadName } = await api.downloadDocumentFile(fileId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = downloadName || fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ tone: 'error', message: 'Fayl yükləmə zamanı xəta baş verdi.' });
    }
  }

  async function handleDocumentFilePreview(fileId: string) {
    try {
      const { blob } = await api.downloadDocumentFile(fileId);
      const url = URL.createObjectURL(blob);

      setFilesDialog((current) => {
        if (current.pdfBlobUrl) URL.revokeObjectURL(current.pdfBlobUrl);
        return { ...current, pdfPreviewFileId: fileId, pdfBlobUrl: url };
      });
    } catch {
      setNotice({ tone: 'error', message: 'Fayl önizləməsi göstərilərkən xəta baş verdi.' });
    }
  }

  async function loadMovementHistory(documentId: string) {
    setLoadingMovementHistoryForId(documentId);
    try {
      const rows = await api.getDocumentMovementsByDocument(documentId);
      setMovementHistoryByDocumentId((current) => ({
        ...current,
        [documentId]: rows
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hərəkət tarixçəsi yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) logout();
    } finally {
      setLoadingMovementHistoryForId((current) => (current === documentId ? null : current));
    }
  }



  async function handleRecordMovementFromDocument() {
    if (!movementTargetDocument) {
      setNotice({ tone: 'error', message: 'Hərəkət üçün sənəd seçilməyib.' });
      return;
    }

    if (!movementForm.organizationalStructureId) {
      setNotice({ tone: 'error', message: 'Təşkilat bölməsini seçin.' });
      return;
    }

    await runAction(async () => {
      const documentId = movementTargetDocument.id;

      await api.recordDocumentMovement({
        documentId,
        organizationalStructureId: movementForm.organizationalStructureId as number,
        notes: movementForm.notes.trim() || undefined
      });

      await loadMovementHistory(documentId);

      setMovementForm({ organizationalStructureId: '', notes: '' });
      await refreshDocuments();
    }, 'Sənəd hərəkəti qeyd edildi.');
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ border: '1px solid', borderColor: 'primary.light', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
      <Accordion
        expanded={documentFormOpen}
        onChange={(_, open) => {
          setDocumentFormOpen(open);
          if (!open) {
            setDocumentForm(emptyDocumentForm());
            setDocumentFormUpload({ files: [], isOriginal: true });
            setDocumentFormExistingFiles([]);
            setBaseDocumentSearchInput('');
            setBaseDocumentPage(1);
            setBaseDocumentLastSearchQuery('');
            setReferenceDefinitions([]);
          }
        }}
        disableGutters
        sx={{ borderRadius: '0 !important', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRounded />}
          sx={{ bgcolor: documentFormOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TopicRounded color="primary" />
            {!documentForm.id ? <AddRounded color="primary" fontSize="small" /> : null}
            <Typography fontWeight={700}>{documentForm.id ? 'Sənədi düzənlə' : 'Yeni sənəd əlavə et'}</Typography>
            {documentForm.id ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
          </Stack>
        </AccordionSummary>

        <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
          <Box component="form" onSubmit={handleDocumentSubmit} sx={{ pt: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Sənəd başlığı"
                required
                value={documentForm.title}
                onChange={(event) => setDocumentForm((current) => ({ ...current, title: event.target.value }))}
                fullWidth
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <Autocomplete
                  fullWidth
                  options={documentTypes}
                  value={documentTypes.find((item) => item.id === documentForm.documentTypeId) || null}
                  getOptionLabel={(option) => option.name}
                  onChange={(_, nextValue) => {
                    const nextDocumentTypeId = nextValue?.id || '';
                    setDocumentForm((current) => ({
                      ...current,
                      documentTypeId: nextDocumentTypeId,
                      references: {}
                    }));
                    void loadReferenceDefinitions(nextDocumentTypeId);
                  }}
                  renderInput={(params) => <TextField {...params} label="Sənəd növü" required />}
                />

                <Autocomplete
                  fullWidth
                  options={baseDocumentOptions}
                  value={baseDocumentValue}
                  loading={baseDocumentLoading}
                  inputValue={baseDocumentSearchInput}
                  onInputChange={(_, nextInput) => setBaseDocumentSearchInput(nextInput)}
                  onChange={(_, nextValue) => setDocumentForm((current) => ({ ...current, baseDocumentId: nextValue?.id || '' }))}
                  getOptionLabel={(option) => option.documentNumber || ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  ListboxProps={{
                    onScroll: (event) => {
                      const listboxNode = event.currentTarget;
                      if (listboxNode.scrollTop + listboxNode.clientHeight === listboxNode.scrollHeight) {
                        if (baseDocuments.length < baseDocumentTotalCount && !baseDocumentLoading) {
                          setBaseDocumentPage((current) => current + 1);
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Qərar sənədi"
                      helperText="Server tərəfində axtarılır (sürüşdürərkən daha çox yüklənir)"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {baseDocumentLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <Autocomplete
                  fullWidth
                  options={physicalLocationOptions}
                  value={physicalLocationOptions.find((item) => item.id === documentForm.physicalLocationId) || null}
                  onChange={(_, nextValue) => setDocumentForm((current) => ({ ...current, physicalLocationId: nextValue?.id || '' }))}
                  getOptionLabel={(option) => `${option.name}${option.logicalPath ? ` · ${option.logicalPath}` : ''}`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  componentsProps={{
                    paper: {
                      sx: {
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.16)'
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiAutocomplete-option': {
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        },
                        '& .MuiAutocomplete-option:last-of-type': {
                          borderBottom: 'none'
                        }
                      }
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.logicalPath || option.logicalLocationName}</Typography>
                      </Stack>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Fiziki yerləşdirmə"
                      helperText="Məntiqi yol daxil olmaqla göstərilir"
                    />
                  )}
                />

                <TextField
                  label="Bitmə tarixi"
                  type="date"
                  value={documentForm.expirationDate}
                  onChange={(event) => setDocumentForm((current) => ({ ...current, expirationDate: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              {documentForm.qrCodeKey ? (
                <TextField
                  label="QR kod açarı"
                  value={documentForm.qrCodeKey}
                  InputProps={{ readOnly: true }}
                  helperText="Bu dəyər server tərəfindən yaradılır."
                  fullWidth
                />
              ) : null}

              {referenceDefinitions.length > 0 ? (
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0, bgcolor: 'background.paper' }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Referans sahələri {selectedDocumentTypeName ? `(${selectedDocumentTypeName})` : ''}
                  </Typography>

                  <Stack spacing={1.5}>
                    {referenceDefinitions.map((referenceField) => renderReferenceInput(referenceField))}
                  </Stack>
                </Box>
              ) : null}

              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 0, bgcolor: 'background.paper' }}>
                <Stack spacing={1.5}>
                  <Typography variant="body2" fontWeight={700}>Sənəd ilə birlikdə fayllar əlavə et</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sənəd yaradılarkən və ya yenilənərkən bir və ya bir neçə faylı birbaşa əlavə edə bilərsiniz.
                  </Typography>

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Button component="label" variant="outlined" startIcon={<InsertDriveFileOutlined />} sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}>
                      Fayllar seç
                      <input
                        hidden
                        type="file"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);
                          setDocumentFormUpload((current) => ({ ...current, files: appendSelectedFiles(current.files, files) }));
                          event.currentTarget.value = '';
                        }}
                      />
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<DocumentScannerRounded />}
                      onClick={openScanDialog}
                      disabled={documentSubmitLoading}
                      sx={{ alignSelf: { xs: 'stretch', md: 'center' } }}
                    >
                      Skan et
                    </Button>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={documentFormUpload.isOriginal}
                          onChange={(_, checked) => setDocumentFormUpload((current) => ({ ...current, isOriginal: checked }))}
                          size="small"
                        />
                      }
                      label="Original fayl"
                      sx={{ m: 0 }}
                    />
                  </Stack>

                  {documentFormUpload.files.length > 0 ? (
                    <Stack spacing={1}>
                      <Chip size="small" color="primary" variant="outlined" label={`${documentFormUpload.files.length} fayl seçildi`} sx={{ width: 'fit-content' }} />
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {documentFormUpload.files.map((file) => (
                          <Chip
                            key={`${file.name}-${file.size}-${file.lastModified}`}
                            size="small"
                            label={file.name}
                            onDelete={() =>
                              setDocumentFormUpload((current) => ({
                                ...current,
                                files: current.files.filter(
                                  (candidate) =>
                                    !(candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified)
                                )
                              }))
                            }
                          />
                        ))}
                      </Stack>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      İstəyə görə bir və ya bir neçə fayl əlavə edə bilərsiniz.
                    </Typography>
                  )}

                  {documentFormExistingFiles.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight={600}>Mövcud Fayllar</Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {documentFormExistingFiles.map((file) => (
                          <Chip
                            key={file.id}
                            size="small"
                            label={file.fileName}
                            variant="outlined"
                            color="default"
                            onDelete={() =>
                              openDeleteConfirm(
                                'Faylı sil',
                                `${file.fileName} faylını silmək istədiyinizə əminsiniz?`,
                                () =>
                                  runAction(async () => {
                                    await api.deleteDocumentFile(file.id);
                                    setDocumentFormExistingFiles((current) => current.filter((f) => f.id !== file.id));
                                  }, 'Fayl silindi.')
                              )
                            }
                          />
                        ))}
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  disabled={isBusy || documentSubmitLoading}
                  type="submit"
                  variant="contained"
                  startIcon={documentSubmitLoading ? <CircularProgress size={16} color="inherit" /> : documentForm.id ? <EditRounded /> : <AddRounded />}
                >
                  {documentSubmitLoading ? (documentForm.id ? 'Yenilənir...' : 'Yaradılır...') : (documentForm.id ? 'Yenilə' : 'Yarat')}
                </Button>

                <Button
                  variant="outlined"
                  disabled={isBusy || documentSubmitLoading}
                  onClick={() => {
                    setDocumentForm(emptyDocumentForm());
                    setDocumentFormUpload({ files: [], isOriginal: true });
                    setDocumentFormExistingFiles([]);
                    setBaseDocumentSearchInput('');
                    setBaseDocumentPage(1);
                    setBaseDocumentLastSearchQuery('');
                    setReferenceDefinitions([]);
                    setDocumentFormOpen(false);
                  }}
                >
                  Ləğv et
                </Button>
              </Stack>
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
          <TopicRounded color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Sənəd siyahısı</Typography>
          <TextField
            select
            size="small"
            label="Məntiqi yerləşdirmə"
            value={selectedLogicalLocationId}
            onChange={(event) => {
              setSelectedLogicalLocationId(event.target.value);
              setDocumentPage(0);
            }}
            sx={{ minWidth: { xs: 220, sm: 280 } }}
            required
          >
            {logicalLocationOptions.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {'\u00A0'.repeat(item.depth * 2)}{item.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Sənəd növü"
            value={documentTypeFilter}
            onChange={(event) => {
              setDocumentTypeFilter(event.target.value);
              setDocumentPage(0);
            }}
            sx={{ minWidth: { xs: 200, sm: 240 } }}
          >
            <MenuItem value="">Hamısı</MenuItem>
            {documentTypes.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            placeholder="Başlıq ilə axtar..."
            value={documentSearchInput}
            onChange={(event) => setDocumentSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setDocumentPage(0);
                setDocumentQuery(documentSearchInput.trim());
              }
            }}
            sx={{ minWidth: { xs: 180, sm: 240 } }}
          />
          <Button
            variant="outlined"
            onClick={() => {
              setDocumentPage(0);
              setDocumentQuery(documentSearchInput.trim());
            }}
          >
            Axtar
          </Button>
          <Chip label={`${documents.length}/${documentsTotal}`} size="small" />
        </Box>

        {isDocumentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : documents.length === 0 ? (
          <EmptyState
            title="Sənəd tapılmadı"
            body="Yeni sənəd əlavə edin və ya axtarış filtrini dəyişin."
          />
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sənəd nömrəsi</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Başlıq</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sənəd növü</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Məntiqi yerləşdirmə</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Fiziki yerləşdirmə</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Bitmə tarixi</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Qərar sənədi</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Fayllar</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {documents.map((item, index) => {
                    const isFilesExpanded = filesDialog.documentId === item.id;
                    const isMovementExpanded = movementFormOpen && movementTargetDocument?.id === item.id;
                    const movementRows = movementHistoryByDocumentId[item.id] || [];
                    const isMovementHistoryLoading = loadingMovementHistoryForId === item.id;

                    return (
                      <React.Fragment key={item.id}>
                        <TableRow
                          hover
                          sx={{
                            bgcolor: isFilesExpanded ? alpha('#0057B8', 0.06) : index % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03),
                            '& .MuiTableCell-root': { borderBottomColor: isFilesExpanded ? 'transparent' : alpha('#0057B8', 0.12) }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{item.documentNumber || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(item.createdDate).toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell>{item.documentTypeName}</TableCell>
                          <TableCell>{item.logicalLocationName || '—'}</TableCell>
                          <TableCell>{item.physicalLocationName || '—'}</TableCell>
                          <TableCell>{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>{item.baseDocumentNumber || '—'}</TableCell>
                          <TableCell>
                            <Chip size="small" label={`${item.fileCount} fayl`} variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title={isFilesExpanded ? 'Faylları gizlət' : 'Faylları göstər'}>
                                <IconButton size="small" color={isFilesExpanded ? 'primary' : 'default'} onClick={() => void openDocumentFiles(item)}>
                                  <AttachFileRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Düzənlə">
                                <IconButton size="small" onClick={() => void startEditingDocument(item)}>
                                  <EditRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Hərəkət et">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    const isSameTarget = movementTargetDocument?.id === item.id;
                                    if (movementFormOpen && isSameTarget) {
                                      setMovementTargetDocument(null);
                                      setMovementForm({ organizationalStructureId: '', notes: '' });
                                      setMovementFormOpen(false);
                                    } else {
                                      setMovementTargetDocument(item);
                                      setMovementForm({ organizationalStructureId: '', notes: '' });
                                      setMovementFormOpen(true);
                                      void loadMovementHistory(item.id);
                                    }
                                  }}
                                >
                                  <CompareArrowsRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Sil">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    openDeleteConfirm(
                                      'Sənədi sil',
                                      `${item.title} sənədini silmək istədiyinizə əminsiniz?`,
                                      () =>
                                        runAction(async () => {
                                          await api.deleteDocument(item.id);
                                          await refreshDocuments();
                                        }, 'Sənəd silindi.')
                                    )
                                  }
                                >
                                  <DeleteRounded fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={10} sx={{ p: 0, borderBottom: isMovementExpanded ? `1px solid ${alpha('#0057B8', 0.12)}` : 'none' }}>
                            <Collapse in={isMovementExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: alpha('#0057B8', 0.12), p: 2 }}>
                                <Stack spacing={2}>
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <CompareArrowsRounded color="primary" />
                                    <Typography fontWeight={700}>Sənəd hərəkəti qeyd et</Typography>
                                  </Stack>

                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                    <TextField
                                      label="Sənəd başlığı"
                                      value={item.title}
                                      InputProps={{ readOnly: true }}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Sənəd növü"
                                      value={item.documentTypeName}
                                      InputProps={{ readOnly: true }}
                                      fullWidth
                                    />
                                  </Stack>

                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                    <TextField
                                      label="Qərar sənədi"
                                      value={item.baseDocumentNumber || '—'}
                                      InputProps={{ readOnly: true }}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Cari fiziki yerləşdirmə"
                                      value={item.physicalLocationName || '—'}
                                      InputProps={{ readOnly: true }}
                                      fullWidth
                                    />
                                  </Stack>

                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                    <TextField
                                      select
                                      label="Təşkilat Bölməsi"
                                      value={movementForm.organizationalStructureId}
                                      onChange={(e) => setMovementForm((current) => ({ ...current, organizationalStructureId: e.target.value ? Number(e.target.value) : '' }))}
                                      fullWidth
                                      required
                                    >
                                      <MenuItem value="">Seçin</MenuItem>
                                      {orgStructureNodes.map((node) => (
                                        <MenuItem key={node.id} value={node.id}>
                                          {' '.repeat(node.depth * 2)}{node.name}
                                        </MenuItem>
                                      ))}
                                    </TextField>

                                    <TextField
                                      label="Qeyd"
                                      value={movementForm.notes}
                                      onChange={(event) => setMovementForm((current) => ({ ...current, notes: event.target.value }))}
                                      fullWidth
                                    />
                                  </Stack>

                                  <Stack direction="row" spacing={1}>
                                    <Button
                                      variant="contained"
                                      startIcon={<CompareArrowsRounded />}
                                      disabled={isBusy || !movementTargetDocument}
                                      onClick={() => void handleRecordMovementFromDocument()}
                                    >
                                      Hərəkəti qeyd et
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      onClick={() => {
                                        setMovementTargetDocument(null);
                                        setMovementForm({ organizationalStructureId: '', notes: '' });
                                        setMovementFormOpen(false);
                                      }}
                                    >
                                      Ləğv et
                                    </Button>
                                  </Stack>

                                  <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1.25 }}>
                                      Hərəkət tarixçəsi
                                    </Typography>

                                    {isMovementHistoryLoading ? (
                                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={22} />
                                      </Box>
                                    ) : movementRows.length === 0 ? (
                                      <Typography variant="caption" color="text.secondary">
                                        Bu sənəd üzrə hərəkət tarixçəsi tapılmadı.
                                      </Typography>
                                    ) : (
                                      <TableContainer>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Verilmə tarixi</TableCell>
                                              <TableCell>Haradan</TableCell>
                                              <TableCell>Hara</TableCell>
                                              <TableCell>Təşkilat bölməsi</TableCell>
                                              <TableCell>Verən</TableCell>
                                              <TableCell>Qəbul edən</TableCell>
                                              <TableCell>Status</TableCell>
                                              <TableCell align="right">Əməliyyat</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {movementRows.map((row) => (
                                              <TableRow key={row.id}>
                                                <TableCell>{new Date(row.givingDate).toLocaleString()}</TableCell>
                                                <TableCell>{row.fromLocationName || '—'}</TableCell>
                                                <TableCell>{row.toLocationName}</TableCell>
                                                <TableCell>{orgStructureNodes.find((n) => n.id === row.organizationalStructureId)?.name || '—'}</TableCell>
                                                <TableCell>{row.movedByUsername || '—'}</TableCell>
                                                <TableCell>{row.receivedByUsername || '—'}</TableCell>
                                                <TableCell>
                                                  <Chip
                                                    size="small"
                                                    color={row.isReceived ? 'success' : 'warning'}
                                                    label={row.isReceived ? 'Qəbul edildi' : 'Qəbul gözləyir'}
                                                  />
                                                </TableCell>
                                                <TableCell align="right">
                                                  {!row.isReceived ? (
                                                    <Tooltip title="Hərəkəti sil">
                                                      <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() =>
                                                          openDeleteConfirm(
                                                            'Hərəkəti sil',
                                                            'Qəbul edilməmiş sənəd hərəkətini silmək istədiyinizə əminsiniz?',
                                                            () =>
                                                              runAction(async () => {
                                                                await api.deleteDocumentMovement(row.id);
                                                                await loadMovementHistory(item.id);
                                                              }, 'Qəbul edilməmiş hərəkət silindi.')
                                                          )
                                                        }
                                                      >
                                                        <DeleteRounded fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                  ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    )}
                                  </Box>
                                </Stack>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell colSpan={9} sx={{ p: 0, borderBottom: isFilesExpanded ? `1px solid ${alpha('#0057B8', 0.12)}` : 'none' }}>
                            <Collapse in={isFilesExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: alpha('#0057B8', 0.12) }}>
                                {filesDialog.isLoading ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={24} />
                                  </Box>
                                ) : filesDialog.files.length === 0 ? (
                                  <Box sx={{ py: 2.5, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Bu sənədə əlavə edilmiş fayl yoxdur.</Typography>
                                  </Box>
                                ) : (
                                  <List disablePadding dense>
                                    {filesDialog.files.map((file, fileIndex) => {
                                      const isPdf = file.mimeType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
                                      const isImage = isImageFile(file.mimeType, file.fileName);
                                      const isPreviewable = isPdf || isImage;
                                      const isActivePreview = filesDialog.pdfPreviewFileId === file.id;

                                      return (
                                        <React.Fragment key={file.id}>
                                          {fileIndex > 0 ? <Divider /> : null}
                                          <ListItemButton
                                            selected={isActivePreview}
                                            sx={{ px: 3, py: 1 }}
                                            onClick={() => {
                                              if (isPreviewable) void handleDocumentFilePreview(file.id);
                                            }}
                                            disableRipple={!isPreviewable}
                                            style={{ cursor: isPreviewable ? 'pointer' : 'default' }}
                                          >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                              {isPdf ? <PictureAsPdfRounded color="error" fontSize="small" /> : <InsertDriveFileOutlined color="action" fontSize="small" />}
                                            </ListItemIcon>
                                            <ListItemText
                                              primary={
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                  <Typography variant="body2" fontWeight={600}>{file.fileName}</Typography>
                                                  {file.isOriginal ? <Chip label="Original" size="small" color="primary" variant="outlined" /> : null}
                                                </Stack>
                                              }
                                              secondary={`${(file.fileSize / 1024).toFixed(1)} KB · ${new Date(file.uploadedDate).toLocaleString()}`}
                                            />

                                            <Stack direction="row" spacing={0.5} onClick={(event) => event.stopPropagation()}>
                                              {isPreviewable ? (
                                                <Tooltip title="Öncədən bax">
                                                  <IconButton size="small" color={isActivePreview ? 'error' : 'default'} onClick={() => void handleDocumentFilePreview(file.id)}>
                                                    <VisibilityRounded fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              ) : null}

                                              <Tooltip title="Yüklə">
                                                <IconButton size="small" color="primary" onClick={() => void handleDocumentFileDownload(file.id, file.fileName)}>
                                                  <DownloadRounded fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Stack>
                                          </ListItemButton>

                                          {isActivePreview && filesDialog.pdfBlobUrl ? (
                                            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', height: 520, bgcolor: 'grey.100', display: 'flex', flexDirection: 'column' }}>
                                              <Stack
                                                direction="row"
                                                spacing={0.5}
                                                sx={{
                                                  px: 1.5,
                                                  py: 1,
                                                  bgcolor: 'background.paper',
                                                  borderBottom: '1px solid',
                                                  borderColor: 'divider',
                                                  justifyContent: 'flex-end'
                                                }}
                                              >
                                                <Tooltip title="Tam ekranda aç">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => setFilesDialog((current) => ({ ...current, pdfMaximized: true }))}
                                                  >
                                                    <FullscreenRounded fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Bağla">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => setFilesDialog((current) => ({ ...current, pdfPreviewFileId: null, pdfBlobUrl: null, pdfMaximized: false }))}
                                                  >
                                                    <CloseRounded fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              </Stack>
                                              <Box sx={{ flex: 1, overflow: 'auto' }}>
                                                {isPdf ? (
                                                  <iframe
                                                    src={filesDialog.pdfBlobUrl ?? undefined}
                                                    title={file.fileName}
                                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                                  />
                                                ) : (
                                                  <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                                    <img
                                                      src={filesDialog.pdfBlobUrl ?? undefined}
                                                      alt={file.fileName}
                                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    />
                                                  </Box>
                                                )}
                                              </Box>
                                            </Box>
                                          ) : null}

                                          <Dialog
                                            open={filesDialog.pdfMaximized && !!filesDialog.pdfBlobUrl}
                                            onClose={() => setFilesDialog((current) => ({ ...current, pdfMaximized: false }))}
                                            maxWidth="lg"
                                            fullWidth
                                            PaperProps={{
                                              sx: {
                                                height: '90vh',
                                                display: 'flex',
                                                flexDirection: 'column'
                                              }
                                            }}
                                          >
                                            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                                              <Typography variant="h6" sx={{ flex: 1 }}>
                                                {file.fileName}
                                              </Typography>
                                              <Stack direction="row" spacing={0.5}>
                                                <Tooltip title="Minimize">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => setFilesDialog((current) => ({ ...current, pdfMaximized: false }))}
                                                  >
                                                    <FullscreenExitRounded />
                                                  </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Bağla">
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => setFilesDialog((current) => ({ ...current, pdfPreviewFileId: null, pdfBlobUrl: null, pdfMaximized: false }))}
                                                  >
                                                    <CloseRounded />
                                                  </IconButton>
                                                </Tooltip>
                                              </Stack>
                                            </DialogTitle>
                                            <Divider />
                                            <DialogContent sx={{ flex: 1, p: 0, display: 'flex' }}>
                                              {isPdf ? (
                                                <iframe
                                                  src={filesDialog.pdfBlobUrl ?? undefined}
                                                  title={file.fileName}
                                                  style={{ width: '100%', height: '100%', border: 'none' }}
                                                />
                                              ) : (
                                                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.100' }}>
                                                  <img
                                                    src={filesDialog.pdfBlobUrl ?? undefined}
                                                    alt={file.fileName}
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                  />
                                                </Box>
                                              )}
                                            </DialogContent>
                                          </Dialog>
                                        </React.Fragment>
                                      );
                                    })}
                                  </List>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              labelRowsPerPage="Səhifə üzrə sətir sayı:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count !== -1 ? count : `>${to}`}`}
              count={documentsTotal}
              page={documentPage}
              onPageChange={(_, nextPage) => setDocumentPage(nextPage)}
              rowsPerPage={documentPageSize}
              onRowsPerPageChange={(event) => {
                setDocumentPageSize(Number(event.target.value));
                setDocumentPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </Box>

      <Dialog
        open={archiveDialog.open}
        onClose={() => setArchiveDialog({ open: false, documentId: null, physicalLocationId: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Sənədi arxivlə</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Arxivləmə üçün fiziki yerləşdirmə seçə bilərsiniz. Boş buraxılarsa sistem defolt qaydada arxivləndirəcək.
            </Typography>

            <Autocomplete
              fullWidth
              options={physicalLocationOptions}
              value={physicalLocationOptions.find((item) => item.id === archiveDialog.physicalLocationId) || null}
              onChange={(_, nextValue) =>
                setArchiveDialog((current) => ({
                  ...current,
                  physicalLocationId: nextValue?.id || ''
                }))
              }
              getOptionLabel={(option) => `${option.name}${option.logicalPath ? ` · ${option.logicalPath}` : ''}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              componentsProps={{
                paper: {
                  sx: {
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.16)'
                  }
                },
                popper: {
                  sx: {
                    '& .MuiAutocomplete-option': {
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    },
                    '& .MuiAutocomplete-option:last-of-type': {
                      borderBottom: 'none'
                    }
                  }
                }
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.logicalPath || option.logicalLocationName}</Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Fiziki yerləşdirmə"
                  helperText="Məntiqi yol daxil olmaqla göstərilir"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialog({ open: false, documentId: null, physicalLocationId: '' })}>Ləğv et</Button>
          <Button
            variant="contained"
            startIcon={<ArchiveRounded />}
            disabled={isBusy || !archiveDialog.documentId}
            onClick={() =>
              void runAction(async () => {
                if (!archiveDialog.documentId) return;

                await api.archiveDocument(archiveDialog.documentId, {
                  physicalLocationId: archiveDialog.physicalLocationId || null
                });
                setArchiveDialog({ open: false, documentId: null, physicalLocationId: '' });
                await refreshDocuments();
              }, 'Sənəd arxivləndi.')
            }
          >
            Arxivlə
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog open={scanDialogOpen} onClose={closeScanDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ScannerRounded color="primary" />
          Skaner
        </DialogTitle>

        <DialogContent>
          {scanDialogStatus === 'connecting' && (
            <Stack spacing={2} alignItems="center" py={2}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary">
                Skan xidmətinə qoşulunur...
              </Typography>
              <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
            </Stack>
          )}

          {scanDialogStatus === 'error' && (
            <Stack spacing={2} py={1}>
              <Alert
                severity="warning"
                icon={<ErrorOutlineRounded />}
                sx={{ alignItems: 'flex-start' }}
              >
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  Skan xidməti tapılmadı
                </Typography>
                <Typography variant="caption" display="block" mb={1}>
                  {scanDialogError}
                </Typography>
                <Typography variant="caption" display="block">
                  Skaner istifadə etmək üçün Dynamsoft Service-i quraşdırın.
                </Typography>
              </Alert>
              <Button
                variant="outlined"
                size="small"
                href="https://demo.dynamsoft.com/DWT/DWTResources/dist/dist/DynamsoftServiceSetup.msi"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ alignSelf: 'flex-start' }}
              >
                Dynamsoft Service-i yüklə
              </Button>
              <Typography variant="caption" color="text.secondary">
                Quraşdırdıqdan sonra bu pəncərəni bağlayıb yenidən açın.
              </Typography>
            </Stack>
          )}

          {scanDialogStatus === 'ready' && (
            <Stack spacing={2} py={1}>
              <Alert severity="success" icon={<CheckCircleOutlineRounded />}>
                Skaner xidməti hazırdır. Skan etməyə başlaya bilərsiniz.
              </Alert>
            </Stack>
          )}

          {scanDialogStatus === 'scanning' && (
            <Stack spacing={2} alignItems="center" py={2}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary">
                Skan edilir, xahiş edirik gözləyin...
              </Typography>
            </Stack>
          )}

          {scanDialogStatus === 'done' && (
            <Stack spacing={2} py={1}>
              <Alert severity="success" icon={<CheckCircleOutlineRounded />}>
                {scanDialogPageCount} səhifə uğurla skan edildi və fayl siyahısına əlavə olundu.
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeScanDialog}>
            {scanDialogStatus === 'done' ? 'Bağla' : 'Ləğv et'}
          </Button>
          {(scanDialogStatus === 'ready' || scanDialogStatus === 'done') && (
            <Button
              variant="contained"
              startIcon={documentScanLoading ? <CircularProgress size={16} color="inherit" /> : <DocumentScannerRounded />}
              onClick={() => void handleScanFromScanner()}
              disabled={documentScanLoading}
            >
              {documentScanLoading ? 'Skan edilir...' : 'Skan et'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.title}
        message={confirmDelete.message}
        loading={confirmingDelete}
        onCancel={() => setConfirmDelete({ open: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Stack>
  );
}