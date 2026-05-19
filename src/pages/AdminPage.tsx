import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  Skeleton,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import ErrorRounded from '@mui/icons-material/ErrorRounded';
import AdminPanelSettingsRounded from '@mui/icons-material/AdminPanelSettingsRounded';
import ArchiveRounded from '@mui/icons-material/ArchiveRounded';
import BadgeRounded from '@mui/icons-material/BadgeRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import CompareArrowsRounded from '@mui/icons-material/CompareArrowsRounded';
import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import FolderSpecialRounded from '@mui/icons-material/FolderSpecialRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import KeyRounded from '@mui/icons-material/KeyRounded';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded';
import PlaylistAddRounded from '@mui/icons-material/PlaylistAddRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import StorageRounded from '@mui/icons-material/StorageRounded';
import TopicRounded from '@mui/icons-material/TopicRounded';
import ManageSearchRounded from '@mui/icons-material/ManageSearchRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import AttachFileRounded from '@mui/icons-material/AttachFileRounded';
import FullscreenRounded from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../features/auth/AuthProvider';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DocumentsPage } from './DocumentsPage';
import { DocumentMovementsPage } from './DocumentMovementsPage';
import { AdvancedSearchPage } from './AdvancedSearchPage';
import { LocationsPage } from './LocationsPage';
import { UserDocumentTypeAccessPage } from './UserDocumentTypeAccessPage';
import OrganizationStructurePage from './OrganizationStructurePage';
import OrganizationStructureTypesPage from './OrganizationStructureTypesPage';
import {
  type BaseDocument,
  type BaseDocumentFile,
  columnTypeOptions,
  columnTypeValueByName,
  type DocumentType,
  type FileProcessing,
  type FileProcessingStatusName,
  type Notification,
  type OrgStructureNode,
  type ReferenceOption,
  type ReferenceRecord,
  type Role,
  type RolePermissionMatrix,
  type UpsertDocumentTypePayload,
  type User
} from '../types/api';
import type { DashboardStats } from '../types/api';

type Notice = {
  tone: 'success' | 'error';
  message: string;
};

type ConfirmDeleteState = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: (() => Promise<void>) | null;
};

type SectionId =
  | 'overview'
  | 'profile'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'fileProcessings'
  | 'documentTypes'
  | 'userDocumentTypeAccess'
  | 'baseDocuments'
  | 'documents'
  | 'documentMovements'
  | 'advancedSearch'
  | 'locations'
  | 'organizationStructure'
  | 'organizationStructureTypes';

type EmbeddedRefFormState = {
  id?: string;
  name: string;
  validationRegex: string;
  columnType: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder: string;
  helpText: string;
  options: ReferenceOption[];
};

type UserFormState = {
  id?: string;
  username: string;
  password: string;
  pin: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  organizationalStructureId?: number;
  roleIds: string[];
};

type RoleFormState = {
  id?: string;
  name: string;
  description: string;
};

type DocumentTypeFormState = {
  id?: string;
  name: string;
  description: string;
  index: number;
  counter: number;
  retentionMonth: number;
  refs: EmbeddedRefFormState[];
};

type OcrPreviewState = {
  open: boolean;
  fileName: string;
  text: string;
  isLoading: boolean;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type ProfileFormState = {
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
};

type BaseDocumentFormState = {
  id?: string;
  documentNumber: string;
  documentDate: string;
  description: string;
};

type BaseDocumentFileUploadState = {
  files: File[];
  isOriginal: boolean;
};

type BaseDocumentFilesDialogState = {
  open: boolean;
  documentId: string | null;
  documentNumber: string;
  files: BaseDocumentFile[];
  isLoading: boolean;
  pdfPreviewFileId: string | null;
  pdfPreviewFileName: string;
  pdfBlobUrl: string | null;
  pdfMaximized: boolean;
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

function isImageFile(mimeType: string, fileName: string) {
  const lowerName = fileName.toLowerCase();
  return imageMimeTypes.has(mimeType.toLowerCase()) || imageExtensions.some((ext) => lowerName.endsWith(ext));
}

const drawerWidth = 290;

const navigation = [
  { id: 'overview' as const, label: 'İcmal', icon: DashboardRounded },
  { id: 'profile' as const, label: 'Profil', icon: AccountCircleRounded },
  { id: 'users' as const, label: 'İstifadəçilər', icon: PeopleAltRounded },
  { id: 'roles' as const, label: 'Rollar', icon: AdminPanelSettingsRounded },
  { id: 'permissions' as const, label: 'İcazələr', icon: ShieldRounded },
  { id: 'userDocumentTypeAccess' as const, label: 'Sənəd növü icazələri', icon: BadgeRounded },
  { id: 'fileProcessings' as const, label: 'Fayl Emalları', icon: FolderSpecialRounded },
  { id: 'documentTypes' as const, label: 'Sənəd Növləri', icon: DescriptionRounded },
  { id: 'baseDocuments' as const, label: 'Qərar sənədləri', icon: TopicRounded },
  { id: 'documents' as const, label: 'Sənədlər', icon: DescriptionRounded },
  { id: 'documentMovements' as const, label: 'Sənəd hərəkətləri', icon: CompareArrowsRounded },
  { id: 'advancedSearch' as const, label: 'Məzmun axtarışı', icon: ManageSearchRounded },
  { id: 'locations' as const, label: 'Yerləşdirmələr', icon: StorageRounded },
  { id: 'organizationStructure' as const, label: 'Təşkilat strukturu', icon: AccountTreeRounded },
  { id: 'organizationStructureTypes' as const, label: 'Struktur növləri', icon: BadgeRounded }
];

const navigationGroups: Array<{ title: string; items: SectionId[] }> = [
  { title: 'Ümumi', items: ['overview'] },
  { title: 'Təşkilatlar', items: ['organizationStructure', 'organizationStructureTypes'] },
  { title: 'Hesab', items: ['profile', 'users', 'roles', 'permissions', 'userDocumentTypeAccess'] },
  { title: 'Sənədlər', items: ['fileProcessings', 'documentTypes', 'baseDocuments', 'documents', 'documentMovements', 'advancedSearch', 'locations'] },
];

const sectionPermissionKeywords: Record<Exclude<SectionId, 'overview' | 'profile'>, string[]> = {
  users: ['users'],
  roles: ['roles'],
  permissions: ['permissions'],
  fileProcessings: ['fileprocessing', 'fileprocessings', 'file-processing'],
  documentTypes: ['documenttypes', 'document-types', 'references'],
  userDocumentTypeAccess: ['userdocumenttypeaccess', 'user-document-type-access', 'documenttypeaccess', 'document-type-access'],
  baseDocuments: ['basedocuments', 'base-documents'],
  documents: ['documents', 'document-search', 'advanced-search'],
  documentMovements: ['documentmovements', 'document-movements', 'movements'],
  advancedSearch: ['advanced-search', 'document-search', 'documents'],
  locations: ['logical-locations', 'physical-locations', 'locations'],
  organizationStructure: ['organizational-structures', 'organizationalstructures'],
  organizationStructureTypes: ['organizational-structure-types', 'organizationalstructuretypes']
};

const fileProcessingStatuses: Array<{ value: number; name: FileProcessingStatusName; label: string }> = [
  { value: 0, name: 'Pending', label: 'Gözləmədə' },
  { value: 1, name: 'Processing', label: 'Emal olunur' },
  { value: 2, name: 'Completed', label: 'Tamamlandı' },
  { value: 3, name: 'Failed', label: 'Xəta' },
  { value: 4, name: 'Indexed', label: 'İndeksləndi' }
];

const fileProcessingStatusValueByName: Record<FileProcessingStatusName, number> = {
  Pending: 0,
  Processing: 1,
  Completed: 2,
  Failed: 3,
  Indexed: 4
};

const fileProcessingStatusLabelByName: Record<FileProcessingStatusName, string> = {
  Pending: 'Gözləmədə',
  Processing: 'Emal olunur',
  Completed: 'Tamamlandı',
  Failed: 'Xəta',
  Indexed: 'İndeksləndi'
};

const emptyUserForm = (): UserFormState => ({
  username: '',
  password: '',
  pin: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  organizationalStructureId: undefined,
  roleIds: []
});

const emptyRoleForm = (): RoleFormState => ({
  name: '',
  description: ''
});

const emptyDocumentTypeForm = (): DocumentTypeFormState => ({
  name: '',
  description: '',
  index: 1,
  counter: 0,
  retentionMonth: 12,
  refs: []
});

const emptyEmbeddedRef = (): EmbeddedRefFormState => ({
  name: '',
  validationRegex: '',
  columnType: 0,
  isRequired: false,
  displayOrder: 1,
  placeholder: '',
  helpText: '',
  options: []
});

const emptyPasswordForm = (): PasswordFormState => ({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
});

const emptyProfileForm = (): ProfileFormState => ({
  username: '',
  fullName: '',
  email: '',
  phoneNumber: ''
});

const emptyBaseDocumentForm = (): BaseDocumentFormState => ({
  documentNumber: '',
  documentDate: new Date().toISOString().slice(0, 10),
  description: ''
});

const appendSelectedFiles = (currentFiles: File[], incomingFiles: File[]) => {
  const fileMap = new Map(currentFiles.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]));

  for (const file of incomingFiles) {
    fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  }

  return Array.from(fileMap.values());
};

function SectionCard({
  title,
  subtitle,
  action,
  icon,
  children
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card sx={{ borderRadius: '4px', border: '1px solid', borderColor: 'divider', boxShadow: 'none', position: 'relative', zIndex: 1 }}>
      <CardHeader
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {icon ? <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box> : null}
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
          </Stack>
        }
        subheader={subtitle}
        action={action}
        sx={{ pb: 0, borderBottom: '1px solid', borderColor: 'divider' }}
      />
      <CardContent>
        <Stack spacing={2}>{children}</Stack>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: '4px',
        p: 4,
        textAlign: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        zIndex: 1
      }}
    >
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {body}
      </Typography>
    </Paper>
  );
}

export function AdminPage() {
  const { logout, session } = useAuth();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [orgStructureNodes, setOrgStructureNodes] = useState<Array<{ id: number; name: string; depth: number }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionMatrix | null>(null);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm());
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm());
  const [documentTypeForm, setDocumentTypeForm] = useState<DocumentTypeFormState>(emptyDocumentTypeForm());
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [docTypeFormOpen, setDocTypeFormOpen] = useState(false);
  const [docTypeRefFormOpen, setDocTypeRefFormOpen] = useState(false);
  const [editingDocTypeRefIdx, setEditingDocTypeRefIdx] = useState<number | null>(null);
  const [docTypeRefForm, setDocTypeRefForm] = useState<EmbeddedRefFormState>(emptyEmbeddedRef());
  const [expandedDocTypeId, setExpandedDocTypeId] = useState<string | null>(null);
  const [expandedDocTypeRefs, setExpandedDocTypeRefs] = useState<ReferenceRecord[]>([]);
  const [loadingExpandedRefs, setLoadingExpandedRefs] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [docTypeSearch, setDocTypeSearch] = useState('');
  const [fileProcessings, setFileProcessings] = useState<FileProcessing[]>([]);
  const [fileProcessingTotal, setFileProcessingTotal] = useState(0);
  const [fileProcessingPage, setFileProcessingPage] = useState(0);
  const [fileProcessingPageSize, setFileProcessingPageSize] = useState(20);
  const [fileProcessingSearchInput, setFileProcessingSearchInput] = useState('');
  const [fileProcessingQuery, setFileProcessingQuery] = useState('');
  const [fileProcessingStatusFilter, setFileProcessingStatusFilter] = useState<'all' | number>('all');
  const [isFileProcessingLoading, setIsFileProcessingLoading] = useState(false);
  const [statusDraftById, setStatusDraftById] = useState<Record<string, number>>({});
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [baseDocuments, setBaseDocuments] = useState<BaseDocument[]>([]);
  const [baseDocumentTotal, setBaseDocumentTotal] = useState(0);
  const [baseDocumentPage, setBaseDocumentPage] = useState(0);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);
  const [dashLastUpdated, setDashLastUpdated] = useState<Date | null>(null);
  const [dashNow, setDashNow] = useState(() => Date.now());
  const [baseDocumentPageSize, setBaseDocumentPageSize] = useState(20);
  const [baseDocumentSearchInput, setBaseDocumentSearchInput] = useState('');
  const [baseDocumentQuery, setBaseDocumentQuery] = useState('');
  const [isBaseDocumentsLoading, setIsBaseDocumentsLoading] = useState(false);
  const [baseDocumentFormOpen, setBaseDocumentFormOpen] = useState(false);
  const [baseDocumentForm, setBaseDocumentForm] = useState<BaseDocumentFormState>(emptyBaseDocumentForm());
  const [baseDocumentFormUpload, setBaseDocumentFormUpload] = useState<BaseDocumentFileUploadState>({ files: [], isOriginal: true });
  const [baseDocumentFormExistingFiles, setBaseDocumentFormExistingFiles] = useState<BaseDocumentFile[]>([]);
  const [baseDocumentFilesDialog, setBaseDocumentFilesDialog] = useState<BaseDocumentFilesDialogState>({
    open: false,
    documentId: null,
    documentNumber: '',
    files: [],
    isLoading: false,
    pdfPreviewFileId: null,
    pdfPreviewFileName: '',
    pdfBlobUrl: null,
    pdfMaximized: false
  });
  const [ocrPreview, setOcrPreview] = useState<OcrPreviewState>({
    open: false,
    fileName: '',
    text: '',
    isLoading: false
  });
  const [myProfile, setMyProfile] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm());
  const [changeOwnPasswordForm, setChangeOwnPasswordForm] = useState<PasswordFormState>(emptyPasswordForm());
  const [setUserPasswordTarget, setSetUserPasswordTarget] = useState<User | null>(null);
  const [setUserPasswordForm, setSetUserPasswordForm] = useState<Omit<PasswordFormState, 'currentPassword'>>({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsAvailable, setNotificationsAvailable] = useState(true);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const value = [user.username, user.fullName || '', user.email || '', user.phoneNumber || '']
        .join(' ')
        .toLowerCase();
      return value.includes(query);
    });
  }, [users, userSearch]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => `${role.name} ${role.description || ''}`.toLowerCase().includes(query));
  }, [roles, roleSearch]);

  const filteredDocumentTypes = useMemo(() => {
    const query = docTypeSearch.trim().toLowerCase();
    if (!query) return documentTypes;
    return documentTypes.filter((item) => {
      const value = `${item.name} ${item.description || ''} ${item.index} ${item.counter} ${item.retentionMonth}`.toLowerCase();
      return value.includes(query);
    });
  }, [documentTypes, docTypeSearch]);

  const currentUserRoleNames = useMemo(
    () => new Set((session?.roles || []).map((role) => role.toLowerCase())),
    [session?.roles]
  );

  const currentUserActions = useMemo(
    () =>
      roles
        .filter((role) => currentUserRoleNames.has(role.name.toLowerCase()))
        .flatMap((role) => role.actions || []),
    [roles, currentUserRoleNames]
  );

  const sectionAccess = useMemo(() => {
    const hasAdminRole = currentUserRoleNames.has('admin') || currentUserRoleNames.has('administrator');

    if (hasAdminRole) {
      return {
        overview: true,
        profile: true,
        users: true,
        roles: true,
        permissions: true,
        fileProcessings: true,
        documentTypes: true,
        userDocumentTypeAccess: true,
        baseDocuments: true,
        documents: true,
        documentMovements: true,
        advancedSearch: true,
        locations: true,
        organizationStructure: true,
        organizationStructureTypes: true
      } satisfies Record<SectionId, boolean>;
    }

    const access: Record<SectionId, boolean> = {
      overview: false,
      profile: true,
      users: false,
      roles: false,
      permissions: false,
      fileProcessings: false,
      documentTypes: false,
      userDocumentTypeAccess: false,
      baseDocuments: false,
      documents: false,
      documentMovements: false,
      advancedSearch: false,
      locations: false,
      organizationStructure: false,
      organizationStructureTypes: false
    };

    for (const action of currentUserActions) {
      const haystack = `${action.controllerName} ${action.actionName} ${action.route}`.toLowerCase();
      (Object.keys(sectionPermissionKeywords) as Array<Exclude<SectionId, 'overview' | 'profile'>>).forEach((section) => {
        if (sectionPermissionKeywords[section].some((key) => haystack.includes(key))) {
          access[section] = true;
        }
      });
    }

    // This section must be visible only if user has receiver endpoint permission.
    access.documentMovements = currentUserActions.some((action) => {
      const controller = action.controllerName.toLowerCase();
      const actionName = action.actionName.toLowerCase();
      const route = action.route.toLowerCase();
      return (controller.includes('documentmovements') || route.includes('documentmovements'))
        && (actionName.includes('receive') || route.includes('/receive'));
    });

    access.overview =
      access.profile ||
      access.users ||
      access.roles ||
      access.permissions ||
      access.fileProcessings ||
      access.documentTypes ||
      access.userDocumentTypeAccess ||
      access.baseDocuments ||
      access.documents ||
      access.documentMovements ||
      access.advancedSearch ||
      access.locations;

    return access;
  }, [currentUserActions, currentUserRoleNames]);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => sectionAccess[item.id]),
    [sectionAccess]
  );

  const visibleNavigationGroups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          title: group.title,
          items: group.items
            .map((sectionId) => visibleNavigation.find((navItem) => navItem.id === sectionId))
            .filter((item): item is (typeof navigation)[number] => Boolean(item))
        }))
        .filter((group) => group.items.length > 0),
    [visibleNavigation]
  );

  const hasAnyAccessibleSection = useMemo(
    () => visibleNavigation.some((item) => item.id !== 'overview'),
    [visibleNavigation]
  );

  const dashboardElapsedLabel = useMemo(() => {
    if (!dashLastUpdated) {
      return null;
    }

    const elapsedSeconds = Math.max(0, Math.floor((dashNow - dashLastUpdated.getTime()) / 1000));
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const elapsed = [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');

    return `Son yenilənmədən keçən: ${elapsed}`;
  }, [dashLastUpdated, dashNow]);

  const notificationsMenuOpen = Boolean(notificationAnchorEl);

  async function loadFileProcessings() {
    setIsFileProcessingLoading(true);

    try {
      const pageResult = await api.getFileProcessings({
        page: fileProcessingPage + 1,
        pageSize: fileProcessingPageSize,
        query: fileProcessingQuery || undefined,
        status: fileProcessingStatusFilter === 'all' ? undefined : fileProcessingStatusFilter,
        sortBy: 'createdDate',
        sortDescending: true
      });

      setFileProcessings(pageResult.items);
      setFileProcessingTotal(pageResult.totalCount);
      setStatusDraftById(
        pageResult.items.reduce<Record<string, number>>((acc, item) => {
          acc[item.id] = fileProcessingStatusValueByName[item.status];
          return acc;
        }, {})
      );
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Fayl emalları yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setIsFileProcessingLoading(false);
    }
  }

  async function loadBaseDocuments() {
    setIsBaseDocumentsLoading(true);
    try {
      const pageResult = await api.searchBaseDocuments({
        page: baseDocumentPage + 1,
        pageSize: baseDocumentPageSize,
        documentNumber: baseDocumentQuery || undefined
      });
      setBaseDocuments(pageResult.items);
      setBaseDocumentTotal(pageResult.totalCount);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Qərar sənədləri yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setIsBaseDocumentsLoading(false);
    }
  }

  async function refreshBaseDocuments() {
    await loadBaseDocuments();
  }

  async function saveFileProcessingStatus(id: string) {
    const nextStatus = statusDraftById[id];
    if (typeof nextStatus !== 'number') {
      return;
    }

    setSavingStatusId(id);
    try {
      await api.updateFileProcessingStatus(id, { status: nextStatus });
      setNotice({ tone: 'success', message: 'Fayl emalı statusu yeniləndi.' });
      await loadFileProcessings();
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : 'Status yenilənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setSavingStatusId(null);
    }
  }

  async function openOcrPreview(item: FileProcessing) {
    setOcrPreview({
      open: true,
      fileName: item.fileName,
      text: '',
      isLoading: true
    });

    try {
      const detail = await api.getFileProcessingById(item.id);
      setOcrPreview({
        open: true,
        fileName: item.fileName,
        text: detail.ocrExtractedText || 'OCR mətni boşdur.',
        isLoading: false
      });
    } catch (detailError) {
      const message = detailError instanceof Error ? detailError.message : 'OCR məzmunu yüklənmədi.';
      setOcrPreview({
        open: true,
        fileName: item.fileName,
        text: message,
        isLoading: false
      });
      if (message.includes('Unauthorized')) {
        logout();
      }
    }
  }

  async function loadDashboardStats() {
    setDashLoading(true);
    setDashError(null);
    try {
      const stats = await api.getDashboardStats();
      setDashStats(stats);
      setDashLastUpdated(new Date());
      setDashNow(Date.now());
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'Dashboard məlumatları yüklənmədi.');
    } finally {
      setDashLoading(false);
    }
  }

  async function loadBootstrapData() {
    setIsBootstrapping(true);

    try {
      const [usersResult, rolesResult, documentTypesResult, profileResult, baseDocumentsResult] = await Promise.allSettled([
        api.getUsers(),
        api.getRoles(),
        api.getDocumentTypes(),
        api.getMe(),
        api.searchBaseDocuments({ page: 1, pageSize: 20 })
      ]);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.items);
        setTotalUsers(usersResult.value.totalCount);
      } else {
        setUsers([]);
        setTotalUsers(0);
      }

      if (rolesResult.status === 'fulfilled') {
        setRoles(rolesResult.value);
        const nextRoleId = selectedRoleId || rolesResult.value[0]?.id || '';
        setSelectedRoleId(nextRoleId);
      } else {
        setRoles([]);
        setSelectedRoleId('');
      }

      if (documentTypesResult.status === 'fulfilled') {
        setDocumentTypes(documentTypesResult.value);
      } else {
        setDocumentTypes([]);
      }

      if (profileResult.status === 'fulfilled') {
        setMyProfile(profileResult.value);
        setProfileForm({
          username: profileResult.value.username,
          fullName: profileResult.value.fullName || '',
          email: profileResult.value.email || '',
          phoneNumber: profileResult.value.phoneNumber || ''
        });
      } else {
        setMyProfile(null);
        setProfileForm({
          username: session?.username || '',
          fullName: '',
          email: '',
          phoneNumber: ''
        });
      }

      if (baseDocumentsResult.status === 'fulfilled') {
        setBaseDocuments(baseDocumentsResult.value.items);
        setBaseDocumentTotal(baseDocumentsResult.value.totalCount);
      } else {
        setBaseDocuments([]);
        setBaseDocumentTotal(0);
      }

      const failures = [usersResult, rolesResult, documentTypesResult, profileResult, baseDocumentsResult].filter(
        (item): item is PromiseRejectedResult => item.status === 'rejected'
      );

      const unauthorizedFailure = failures.find((item) =>
        String(item.reason instanceof Error ? item.reason.message : item.reason)
          .toLowerCase()
          .includes('unauthorized')
      );

      if (unauthorizedFailure) {
        logout();
      }
    } catch (bootstrapError) {
      const message = bootstrapError instanceof Error ? bootstrapError.message : 'Dashboard məlumatları yüklənmədi.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function loadNotifications() {
    if (!notificationsAvailable) {
      return;
    }

    setIsNotificationsLoading(true);

    try {
      const [itemsResult, countResult] = await Promise.all([
        api.getMyNotifications({ page: 1, pageSize: 8 }),
        api.getUnreadNotificationsCount()
      ]);

      setNotifications(itemsResult.items);
      setUnreadNotificationCount(countResult.count);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('Unauthorized')) {
        logout();
        return;
      }

      // Hide bell if API is not available for this user/environment.
      setNotificationsAvailable(false);
    } finally {
      setIsNotificationsLoading(false);
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    await runAction(async () => {
      await api.markNotificationAsRead(notificationId);
      await loadNotifications();
    }, 'Bildiriş oxunmuş kimi qeyd edildi.');
  }

  async function markAllNotificationsAsRead() {
    await runAction(async () => {
      await api.markAllNotificationsAsRead();
      await loadNotifications();
    }, 'Bütün bildirişlər oxunmuş kimi qeyd edildi.');
  }

  function handleOpenNotifications(event: React.MouseEvent<HTMLElement>) {
    setNotificationAnchorEl(event.currentTarget);
    void loadNotifications();
  }

  function handleCloseNotifications() {
    setNotificationAnchorEl(null);
  }

  async function loadRoleMatrix(roleId: string) {
    if (!roleId) {
      setPermissionMatrix(null);
      setSelectedActionIds(new Set());
      return;
    }

    try {
      const matrix = await api.getRoleMatrix(roleId);
      setPermissionMatrix(matrix);
      setSelectedActionIds(
        new Set(
          matrix.controllers.flatMap((controller) =>
            controller.actions.filter((action) => action.isAssigned).map((action) => action.actionId)
          )
        )
      );
    } catch (matrixError) {
      setNotice({
        tone: 'error',
        message: matrixError instanceof Error ? matrixError.message : 'İcazələr yüklənmədi.'
      });
    }
  }

  useEffect(() => {
    void loadBootstrapData();
  }, []);

  useEffect(() => {
    void loadDashboardStats();
    const timer = window.setInterval(() => void loadDashboardStats(), 45000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dashLastUpdated) {
      return;
    }

    const timer = window.setInterval(() => {
      setDashNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dashLastUpdated]);

  useEffect(() => {
    if (activeSection !== 'permissions') {
      return;
    }
    void loadRoleMatrix(selectedRoleId);
  }, [selectedRoleId, activeSection]);

  useEffect(() => {
    if (sectionAccess[activeSection]) {
      return;
    }
    const fallback = visibleNavigation[0]?.id;
    if (fallback) {
      setActiveSection(fallback);
    }
  }, [activeSection, sectionAccess, visibleNavigation]);

  useEffect(() => {
    if (activeSection !== 'fileProcessings') {
      return;
    }

    void loadFileProcessings();
  }, [activeSection, fileProcessingPage, fileProcessingPageSize, fileProcessingQuery, fileProcessingStatusFilter]);

  useEffect(() => {
    if (activeSection !== 'baseDocuments') {
      return;
    }

    void loadBaseDocuments();
  }, [activeSection, baseDocumentPage, baseDocumentPageSize, baseDocumentQuery]);

  useEffect(() => {
    if (!notificationsAvailable) {
      return;
    }

    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 60000);

    return () => window.clearInterval(timer);
  }, [notificationsAvailable]);

  useEffect(() => {
    if (!userFormOpen) {
      return;
    }

    void (async () => {
      try {
        const tree = await api.getOrgStructureTree();
        setOrgStructureNodes(flattenOrgStructure(tree));
      } catch {
        setOrgStructureNodes([]);
      }
    })();
  }, [userFormOpen]);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setIsBusy(true);
    setNotice(null);

    try {
      await action();
      setNotice({ tone: 'success', message: successMessage });
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Əməliyyat uğursuz oldu.';
      setNotice({ tone: 'error', message });
      if (message.includes('Unauthorized')) {
        logout();
      }
    } finally {
      setIsBusy(false);
    }
  }

  const openDeleteConfirm = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setConfirmDelete({ open: true, title, message, onConfirm });
  };

  async function handleConfirmDelete() {
    if (!confirmDelete.onConfirm) return;
    setConfirmingDelete(true);
    try {
      await confirmDelete.onConfirm();
    } finally {
      setConfirmingDelete(false);
      setConfirmDelete({ open: false, title: '', message: '', onConfirm: null });
    }
  }

  async function refreshUsers() {
    const result = await api.getUsers();
    setUsers(result.items);
    setTotalUsers(result.totalCount);
  }

  async function refreshRoles() {
    const result = await api.getRoles();
    setRoles(result);
    if (!selectedRoleId && result.length > 0) {
      setSelectedRoleId(result[0].id);
    }
  }

  async function refreshDocumentTypes() {
    const result = await api.getDocumentTypes();
    setDocumentTypes(result);
  }

  function flattenOrgStructure(nodes: OrgStructureNode[], depth = 0): Array<{ id: number; name: string; depth: number }> {
    return nodes.flatMap((node) => [
      { id: node.id, name: node.name, depth },
      ...flattenOrgStructure(node.children, depth + 1)
    ]);
  }



  async function handleBaseDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      const payload = {
        documentNumber: baseDocumentForm.documentNumber,
        documentDate: new Date(baseDocumentForm.documentDate).toISOString(),
        description: baseDocumentForm.description || null
      };

      let targetBaseDocumentId = baseDocumentForm.id;

      if (baseDocumentForm.id) {
        const updated = await api.updateBaseDocument(baseDocumentForm.id, payload);
        targetBaseDocumentId = updated.id;
      } else {
        const created = await api.createBaseDocument(payload);
        targetBaseDocumentId = created.id;
      }

      if (targetBaseDocumentId && baseDocumentFormUpload.files.length > 0) {
        for (const file of baseDocumentFormUpload.files) {
          await api.uploadBaseDocumentFile(targetBaseDocumentId, file, baseDocumentFormUpload.isOriginal);
        }
      }

      setBaseDocumentForm(emptyBaseDocumentForm());
      setBaseDocumentFormUpload({ files: [], isOriginal: true });
      setBaseDocumentFormExistingFiles([]);
      setBaseDocumentFormOpen(false);
      await refreshBaseDocuments();
    }, baseDocumentForm.id ? 'Qərar sənədi yeniləndi.' : 'Qərar sənədi və faylları yaradıldı.');
  }

  function startEditingBaseDocument(item: BaseDocument) {
    setActiveSection('baseDocuments');
    setBaseDocumentFormOpen(true);
    setBaseDocumentFormUpload({ files: [], isOriginal: true });
    setBaseDocumentForm({
      id: item.id,
      documentNumber: item.documentNumber,
      documentDate: new Date(item.documentDate).toISOString().slice(0, 10),
      description: item.description || ''
    });

    try {
      void (async () => {
        const detail = await api.getBaseDocumentDetail(item.id);
        setBaseDocumentFormExistingFiles(detail.files);
      })();
    } catch {
      setBaseDocumentFormExistingFiles([]);
    }
  }

  async function openBaseDocumentFiles(item: BaseDocument) {
    // toggle: collapse if same row clicked
    if (baseDocumentFilesDialog.documentId === item.id) {
      if (baseDocumentFilesDialog.pdfBlobUrl) URL.revokeObjectURL(baseDocumentFilesDialog.pdfBlobUrl);
      setBaseDocumentFilesDialog({ open: false, documentId: null, documentNumber: '', files: [], isLoading: false, pdfPreviewFileId: null, pdfPreviewFileName: '', pdfBlobUrl: null, pdfMaximized: false });
      return;
    }
    if (baseDocumentFilesDialog.pdfBlobUrl) URL.revokeObjectURL(baseDocumentFilesDialog.pdfBlobUrl);
    setBaseDocumentFilesDialog({
      open: true,
      documentId: item.id,
      documentNumber: item.documentNumber,
      files: [],
      isLoading: true,
      pdfPreviewFileId: null,
      pdfPreviewFileName: '',
      pdfBlobUrl: null,
      pdfMaximized: false
    });
    try {
      const detail = await api.getBaseDocumentDetail(item.id);
      setBaseDocumentFilesDialog((c) => ({ ...c, files: detail.files, isLoading: false }));
    } catch {
      setBaseDocumentFilesDialog((c) => ({ ...c, isLoading: false }));
    }
  }

  async function handleBaseDocumentFileDownload(fileId: string, fileName: string) {
    try {
      const { blob, fileName: dlName } = await api.downloadBaseDocumentFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dlName || fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ tone: 'error', message: 'Fayl yükləmə zamanı xəta baş verdi.' });
    }
  }

  async function handleBaseDocumentFilePreview(fileId: string, fileName: string) {
    try {
      const { blob } = await api.downloadBaseDocumentFile(fileId);
      const url = URL.createObjectURL(blob);
      setBaseDocumentFilesDialog((c) => {
        if (c.pdfBlobUrl) URL.revokeObjectURL(c.pdfBlobUrl);
        return { ...c, pdfPreviewFileId: fileId, pdfPreviewFileName: fileName, pdfBlobUrl: url };
      });
    } catch {
      setNotice({ tone: 'error', message: 'Fayl önizləməsi göstərilərkən xəta baş verdi.' });
    }
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      if (userForm.id) {
        await api.updateUser(userForm.id, {
          username: userForm.username,
          fullName: userForm.fullName || undefined,
          email: userForm.email || undefined,
          phoneNumber: userForm.phoneNumber || undefined,
          organizationalStructureId: userForm.organizationalStructureId || null
        });
        await api.assignRoles(userForm.id, { roleIds: userForm.roleIds });
      } else {
        await api.createUser({
          username: userForm.username,
          password: userForm.password,
          pin: userForm.pin,
          fullName: userForm.fullName || undefined,
          email: userForm.email || undefined,
          phoneNumber: userForm.phoneNumber || undefined,
          organizationalStructureId: userForm.organizationalStructureId || null,
          roleIds: userForm.roleIds
        });
      }

      await refreshUsers();
      setUserForm(emptyUserForm());
      setUserFormOpen(false);
    }, userForm.id ? 'İstifadəçi yeniləndi.' : 'İstifadəçi yaradıldı.');
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      if (roleForm.id) {
        await api.updateRole(roleForm.id, {
          name: roleForm.name,
          description: roleForm.description || undefined
        });
      } else {
        await api.createRole({
          name: roleForm.name,
          description: roleForm.description || undefined
        });
      }

      await refreshRoles();
      setRoleForm(emptyRoleForm());
      setRoleFormOpen(false);
    }, roleForm.id ? 'Rol yeniləndi.' : 'Rol yaradıldı.');
  }

  async function handleChangeOwnPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      await api.changeOwnPassword({
        currentPassword: changeOwnPasswordForm.currentPassword,
        newPassword: changeOwnPasswordForm.newPassword,
        confirmNewPassword: changeOwnPasswordForm.confirmNewPassword
      });

      setChangeOwnPasswordForm(emptyPasswordForm());
    }, 'Şifrə dəyişdirildi.');
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      const updated = await api.updateMyProfile({
        username: profileForm.username,
        fullName: profileForm.fullName || undefined,
        email: profileForm.email || undefined,
        phoneNumber: profileForm.phoneNumber || undefined
      });

      setMyProfile(updated);
      setProfileForm({
        username: updated.username,
        fullName: updated.fullName || '',
        email: updated.email || '',
        phoneNumber: updated.phoneNumber || ''
      });
    }, 'Profil məlumatları yeniləndi.');
  }

  async function handleAdminSetUserPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!setUserPasswordTarget) {
      return;
    }

    await runAction(async () => {
      await api.setUserPassword(setUserPasswordTarget.id, {
        newPassword: setUserPasswordForm.newPassword,
        confirmNewPassword: setUserPasswordForm.confirmNewPassword
      });

      setSetUserPasswordTarget(null);
      setSetUserPasswordForm({ newPassword: '', confirmNewPassword: '' });
    }, 'İstifadəçi şifrəsi dəyişdirildi.');
  }

  async function handleDocumentTypeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      const payload: UpsertDocumentTypePayload = {
        name: documentTypeForm.name,
        description: documentTypeForm.description || undefined,
        index: Number(documentTypeForm.index),
        counter: Number(documentTypeForm.counter),
        retentionMonth: Number(documentTypeForm.retentionMonth),
        references: documentTypeForm.refs.map((ref) => ({
          id: ref.id || undefined,
          name: ref.name,
          validationRegex: ref.validationRegex || undefined,
          columnType: Number(ref.columnType),
          isRequired: ref.isRequired,
          displayOrder: Number(ref.displayOrder),
          placeholder: ref.placeholder || undefined,
          helpText: ref.helpText || undefined,
          options: ref.options.map((o) => ({
            value: o.value,
            label: o.label,
            displayOrder: Number(o.displayOrder),
            isActive: o.isActive
          }))
        }))
      };
      if (documentTypeForm.id) {
        await api.updateDocumentType(documentTypeForm.id, payload);
      } else {
        await api.createDocumentType(payload);
      }
      await refreshDocumentTypes();
      setDocumentTypeForm(emptyDocumentTypeForm());
      setDocTypeFormOpen(false);
      setDocTypeRefFormOpen(false);
    }, documentTypeForm.id ? 'Sənəd növü yeniləndi.' : 'Sənəd növü yaradıldı.');
  }

  function startEditingUser(user: User) {
    setActiveSection('users');
    setUserFormOpen(true);
    setUserForm({
      id: user.id,
      username: user.username,
      password: '',
      pin: '',
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      organizationalStructureId: user.organizationalStructureId ?? undefined,
      roleIds: user.roles.map((role) => role.id)
    });
  }

  function startEditingRole(role: Role) {
    setActiveSection('roles');
    setRoleFormOpen(true);
    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || ''
    });
  }

  async function startEditingDocumentType(item: DocumentType) {
    setActiveSection('documentTypes');
    setDocTypeFormOpen(true);
    setDocTypeRefFormOpen(false);
    setDocumentTypeForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      index: item.index,
      counter: item.counter,
      retentionMonth: item.retentionMonth,
      refs: []
    });
    try {
      const withRefs = await api.getDocumentTypeWithReferences(item.id);
      setDocumentTypeForm((c) => ({
        ...c,
        refs: withRefs.references.map((ref) => ({
          id: ref.id,
          name: ref.name,
          validationRegex: ref.validationRegex || '',
          columnType: columnTypeValueByName[ref.columnType] ?? 0,
          isRequired: ref.isRequired,
          displayOrder: ref.displayOrder,
          placeholder: ref.placeholder || '',
          helpText: ref.helpText || '',
          options: ref.options
        }))
      }));
    } catch (e) {
      setNotice({ tone: 'error', message: e instanceof Error ? e.message : 'İstinadlar yüklənmədi.' });
    }
  }

  async function toggleExpandDocType(id: string) {
    if (expandedDocTypeId === id) {
      setExpandedDocTypeId(null);
      setExpandedDocTypeRefs([]);
      return;
    }
    setExpandedDocTypeId(id);
    setLoadingExpandedRefs(true);
    try {
      const result = await api.getDocumentTypeWithReferences(id);
      setExpandedDocTypeRefs(result.references);
    } catch (e) {
      setNotice({ tone: 'error', message: e instanceof Error ? e.message : 'İstinadlar yüklənmədi.' });
      setExpandedDocTypeId(null);
    } finally {
      setLoadingExpandedRefs(false);
    }
  }

  function toggleUserRole(roleId: string, checked: boolean) {
    setUserForm((current) => ({
      ...current,
      roleIds: checked ? [...current.roleIds, roleId] : current.roleIds.filter((item) => item !== roleId)
    }));
  }

  const originalAssignedIds = useMemo(
    () =>
      new Set(
        permissionMatrix?.controllers.flatMap((controller) =>
          controller.actions.filter((action) => action.isAssigned).map((action) => action.actionId)
        ) || []
      ),
    [permissionMatrix]
  );

  const currentSectionTitle = visibleNavigation.find((item) => item.id === activeSection)?.label || 'İcmal';

  const navigationContent = (
    <Stack sx={{ height: '100%' }}>
      <Box sx={{ px: 2.5, py: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArchiveRounded sx={{ color: '#001e45', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ color: 'common.white', fontWeight: 700 }}>EArchive</Typography>
        </Stack>
        <Typography color="rgba(255,255,255,0.72)" variant="overline">
          İdarəetmə Paneli
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.72)', mt: 1 }} variant="body2">
          Arxiv girişini, metadata qaydalarını və sənəd sazlanması bir yerdən idarə edin.
        </Typography>
      </Box>

      <List sx={{ px: 1.5 }}>
        {visibleNavigationGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1.25 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.55)',
                px: 1.25,
                pb: 0.5,
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontWeight: 700
              }}
            >
              {group.title}
            </Typography>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.id}
                  selected={activeSection === item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileNavOpen(false);
                  }}
                  sx={{
                    borderRadius: 3,
                    mb: 0.75,
                    color: 'rgba(255,255,255,0.86)',
                    '&.Mui-selected': {
                      bgcolor: alpha('#ffffff', 0.16)
                    },
                    '&.Mui-selected:hover': {
                      bgcolor: alpha('#ffffff', 0.2)
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 42, color: 'inherit' }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </List>

      <Box sx={{ mt: 'auto', px: 2.5, py: 3 }} />
    </Stack>
  );

  return (
    <Box className="page-shell page-fade-in" sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        color="transparent"
        elevation={0}
        position="fixed"
        sx={{
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` }
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          {!isLargeScreen ? (
            <IconButton edge="start" onClick={() => setMobileNavOpen(true)}>
              <MenuRounded />
            </IconButton>
          ) : null}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5">{currentSectionTitle}</Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} color="text.secondary">
            {myProfile?.email || myProfile?.username || session?.username || ''}
          </Typography>
          {notificationsAvailable ? (
            <IconButton color="inherit" onClick={handleOpenNotifications}>
              <Badge badgeContent={unreadNotificationCount} color="error" max={99}>
                <NotificationsNoneRounded />
              </Badge>
            </IconButton>
          ) : null}
          <Stack direction="row" spacing={1}>
            <Button color="inherit" startIcon={<LogoutRounded />} onClick={logout} variant="text">
              Çıxış
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={notificationAnchorEl}
        open={notificationsMenuOpen}
        onClose={handleCloseNotifications}
        PaperProps={{
          sx: {
            width: 380,
            maxWidth: 'calc(100vw - 24px)',
            mt: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>Bildirişlər</Typography>
          <Button
            size="small"
            variant="text"
            startIcon={<DoneAllRounded fontSize="small" />}
            disabled={isBusy || unreadNotificationCount === 0}
            onClick={() => void markAllNotificationsAsRead()}
          >
            Hamısını oxu
          </Button>
        </Box>
        <Divider />
        {isNotificationsLoading ? (
          <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">Bildiriş yoxdur.</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                if (!notification.isRead) {
                  void markNotificationAsRead(notification.id);
                }
              }}
              sx={{
                alignItems: 'flex-start',
                whiteSpace: 'normal',
                py: 1.25,
                borderLeft: '3px solid',
                borderLeftColor: notification.isRead ? 'transparent' : 'primary.main',
                bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.06)
              }}
            >
              <Stack spacing={0.6} sx={{ width: '100%' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography variant="body2" fontWeight={700} noWrap>{notification.title}</Typography>
                  <Chip
                    label={notification.type}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.67rem' }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Stack>
            </MenuItem>
          ))
        )}
      </Menu>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {navigationContent}
        </Drawer>
        <Drawer
          open
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', border: 'none' }
          }}
        >
          {navigationContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { lg: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3.5 } }} className="card-reveal">
          <Stack spacing={3}>
            {isBootstrapping ? <Alert severity="info">API-dən admin məlumatları yüklənir.</Alert> : null}

            {activeSection === 'overview' && sectionAccess.overview ? (
              <Stack spacing={3}>
                <Box
                  sx={{
                    borderRadius: 3,
                    p: { xs: 2, md: 3 },
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha('#ffffff', 0.96)} 55%)`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -70,
                      right: -40,
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      background: alpha(theme.palette.secondary.main, 0.12)
                    }}
                  />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
                    <Stack spacing={0.7}>
                      <Typography variant="overline" color="primary.main" fontWeight={700}>
                        E-Archive idarəetmə paneli
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                        Dashboard
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          size="small"
                          label={dashLoading ? 'Məlumatlar yenilənir' : 'Məlumatlar aktivdir'}
                          color={dashLoading ? 'warning' : 'success'}
                          variant="outlined"
                        />
                        {dashboardElapsedLabel ? (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={dashboardElapsedLabel}
                          />
                        ) : null}
                      </Stack>
                    </Stack>
                    <Button
                      variant="contained"
                      startIcon={dashLoading ? <CircularProgress size={14} color="inherit" /> : <RefreshRounded />}
                      onClick={() => void loadDashboardStats()}
                      disabled={dashLoading}
                      sx={{ borderRadius: 2, minWidth: 140 }}
                    >
                      Yenilə
                    </Button>
                  </Stack>
                </Box>

                {/* Error state */}
                {dashError && (
                  <Alert
                    severity="error"
                    action={
                      <Button size="small" color="inherit" onClick={() => void loadDashboardStats()}>
                        Yenidən cəhd et
                      </Button>
                    }
                    sx={{ borderRadius: '4px' }}
                  >
                    {dashError}
                  </Alert>
                )}

                {/* Primary KPI cards */}
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: 'block' }}>
                    Əsas göstəricilər
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
                      gap: 2
                    }}
                  >
                    {([
                      { label: 'Sənəd sayı', value: dashStats?.totalDocuments, icon: <DescriptionRounded />, color: '#0057B8', hint: 'Ümumi sənədlər' },
                      { label: 'Bu gün əlavə edilən', value: dashStats?.insertedDocumentsToday, icon: <AddRounded />, color: '#2e7d32', hint: 'Bugünkü sənədlər' },
                      { label: 'İndekslənmiş fayllar', value: dashStats?.indexedFileCount, icon: <DoneAllRounded />, color: '#6a1b9a', hint: 'OCR ilə işlənmiş' },
                      { label: 'Gözləyən hərəkətlər', value: dashStats?.pendingMovementDocumentCount, icon: <CompareArrowsRounded />, color: '#e65100', hint: 'Qəbul gözləyən' },
                      { label: 'İstifadəçilər', value: dashStats?.totalUsers, icon: <GroupsRounded />, color: '#1565c0', hint: 'Aktiv hesablar' },
                    ] as Array<{ label: string; value: number | undefined; icon: React.ReactNode; color: string; hint: string }>).map((card) => (
                      <Card
                        key={card.label}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: alpha(card.color, 0.32),
                          background: `linear-gradient(180deg, ${alpha(card.color, 0.1)} 0%, ${alpha('#ffffff', 0.96)} 65%)`,
                          transition: 'transform 180ms ease, box-shadow 180ms ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 22px ${alpha(card.color, 0.16)}`
                          }
                        }}
                      >
                        <CardContent>
                          {dashLoading && !dashStats ? (
                            <Stack spacing={1}>
                              <Skeleton variant="rectangular" height={36} width="55%" />
                              <Skeleton variant="text" width="80%" />
                              <Skeleton variant="text" width="50%" />
                            </Stack>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              <Box
                                sx={{
                                  color: card.color,
                                  mt: 0.2,
                                  flexShrink: 0,
                                  p: 1,
                                  borderRadius: 1.5,
                                  bgcolor: alpha(card.color, 0.14)
                                }}
                              >
                                {card.icon}
                              </Box>
                              <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ color: card.color, lineHeight: 1.1 }}>
                                  {card.value?.toLocaleString('az-AZ') ?? '—'}
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{card.label}</Typography>
                                <Typography variant="caption" color="text.secondary">{card.hint}</Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>

                {/* Secondary info cards */}
                <Box>
                  <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: 'block' }}>
                    Əlavə məlumatlar
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                      gap: 1.5
                    }}
                  >
                    {([
                      { label: 'Gözləyən emal', value: dashStats?.pendingFileProcessingCount, icon: <AccessTimeRounded />, color: '#f57c00' },
                      { label: 'Xətalı emal', value: dashStats?.failedFileProcessingCount, icon: <ErrorRounded />, color: '#c62828' },
                      { label: 'Oxunmamış bildiriş', value: dashStats?.unreadNotificationCount, icon: <NotificationsNoneRounded />, color: '#1565c0' },
                      { label: 'Arxivlənmiş sənəd', value: dashStats?.archivedDocuments, icon: <ArchiveRounded />, color: '#4e342e' },
                      { label: 'Aktiv imha dövrü', value: dashStats?.activeDisposalCycleCount, icon: <DeleteRounded />, color: '#880e4f' },
                      { label: 'Sənəd növü', value: dashStats?.totalDocumentTypes, icon: <FolderSpecialRounded />, color: '#e65100' },
                      { label: 'Məntiqi yerlər', value: dashStats?.totalLogicalLocations, icon: <StorageRounded />, color: '#283593' },
                      { label: 'Fiziki yerlər', value: dashStats?.totalPhysicalLocations, icon: <AccountTreeRounded />, color: '#00695c' },
                    ] as Array<{ label: string; value: number | undefined; icon: React.ReactNode; color: string }>).map((card) => (
                      <Paper
                        key={card.label}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderColor: alpha(card.color, 0.28),
                          bgcolor: alpha(card.color, 0.04)
                        }}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          {dashLoading && !dashStats ? (
                            <Stack spacing={0.5}>
                              <Skeleton variant="text" width="45%" height={28} />
                              <Skeleton variant="text" width="70%" />
                            </Stack>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box
                                sx={{
                                  color: card.color,
                                  flexShrink: 0,
                                  p: 0.9,
                                  borderRadius: 1.25,
                                  bgcolor: alpha(card.color, 0.16)
                                }}
                              >
                                {card.icon}
                              </Box>
                              <Box>
                                <Typography variant="h6" fontWeight={700} sx={{ color: card.color, lineHeight: 1.1 }}>
                                  {card.value?.toLocaleString('az-AZ') ?? '—'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Paper>
                    ))}
                  </Box>
                </Box>

              </Stack>
            ) : null}


            {activeSection === 'profile' && sectionAccess.profile ? (
              <Stack spacing={2}>
                <SectionCard
                  title="Profil məlumatları"
                  subtitle="Öz istifadəçi məlumatlarınızı yeniləyin."
                  icon={<AccountCircleRounded />}
                >
                  <Box component="form" onSubmit={handleProfileSubmit}>
                    <Stack spacing={2}>
                      <TextField
                        label="İstifadəçi adı"
                        required
                        value={profileForm.username}
                        onChange={(e) => setProfileForm((c) => ({ ...c, username: e.target.value }))}
                        fullWidth
                      />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          label="Ad Soyad"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm((c) => ({ ...c, fullName: e.target.value }))}
                          fullWidth
                        />
                        <TextField
                          label="E-poçt"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((c) => ({ ...c, email: e.target.value }))}
                          fullWidth
                        />
                      </Box>
                      <TextField
                        label="Telefon"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm((c) => ({ ...c, phoneNumber: e.target.value }))}
                        fullWidth
                      />
                      <Stack direction="row" justifyContent="flex-end">
                        <Button type="submit" variant="contained" disabled={isBusy} startIcon={<EditRounded />}>
                          Məlumatları yenilə
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </SectionCard>

                <SectionCard
                  title="Şifrəni dəyiş"
                  subtitle="Hesab təhlükəsizliyi üçün yeni şifrə təyin edin."
                  icon={<KeyRounded />}
                >
                  <Box component="form" onSubmit={handleChangeOwnPassword}>
                    <Stack spacing={2}>
                      <TextField
                        label="Cari şifrə"
                        type="password"
                        required
                        value={changeOwnPasswordForm.currentPassword}
                        onChange={(event) => setChangeOwnPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="Yeni şifrə"
                        type="password"
                        required
                        value={changeOwnPasswordForm.newPassword}
                        onChange={(event) => setChangeOwnPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                        helperText="Minimum 8 simvol, ən az 1 böyük hərf və 1 rəqəm"
                        fullWidth
                      />
                      <TextField
                        label="Yeni şifrə təkrarı"
                        type="password"
                        required
                        value={changeOwnPasswordForm.confirmNewPassword}
                        onChange={(event) => setChangeOwnPasswordForm((current) => ({ ...current, confirmNewPassword: event.target.value }))}
                        fullWidth
                      />
                      <Stack direction="row" justifyContent="flex-end">
                        <Button type="submit" variant="contained" disabled={isBusy} startIcon={<KeyRounded />}>
                          Şifrəni yenilə
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </SectionCard>
              </Stack>
            ) : null}

            {activeSection === 'users' && sectionAccess.users ? (
              <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {/* Accordion form */}
                <Accordion
                  expanded={userFormOpen}
                  onChange={(_, open) => { setUserFormOpen(open); if (!open) setUserForm(emptyUserForm()); }}
                  disableGutters
                  sx={{ borderRadius: '0 !important', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider', mb: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ bgcolor: userFormOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <PeopleAltRounded color="primary" />
                      {!userForm.id ? <AddRounded color="primary" fontSize="small" /> : null}
                      <Typography fontWeight={700}>{userForm.id ? 'İstifadəçini düzənlə' : 'Yeni istifadəçi əlavə et'}</Typography>
                      {userForm.id ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box component="form" onSubmit={handleUserSubmit} sx={{ pt: 1 }}>
                      <Stack spacing={2}>
                        <TextField label="İstifadəçi adı" value={userForm.username} onChange={(e) => setUserForm((c) => ({ ...c, username: e.target.value }))} required fullWidth />
                        {!userForm.id ? (
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField label="Şifrə" type="password" value={userForm.password} onChange={(e) => setUserForm((c) => ({ ...c, password: e.target.value }))} required fullWidth />
                            <TextField label="PIN" value={userForm.pin} onChange={(e) => setUserForm((c) => ({ ...c, pin: e.target.value }))} required fullWidth />
                          </Box>
                        ) : null}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField label="Ad Soyad" value={userForm.fullName} onChange={(e) => setUserForm((c) => ({ ...c, fullName: e.target.value }))} fullWidth />
                          <TextField label="E-poçt" type="email" value={userForm.email} onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))} fullWidth />
                        </Box>
                        <TextField label="Telefon nömrəsi" value={userForm.phoneNumber} onChange={(e) => setUserForm((c) => ({ ...c, phoneNumber: e.target.value }))} fullWidth />
                        <TextField
                          select
                          label="Təşkilat Bölməsi"
                          value={userForm.organizationalStructureId || ''}
                          onChange={(e) => setUserForm((c) => ({ ...c, organizationalStructureId: e.target.value ? Number(e.target.value) : undefined }))}
                          fullWidth
                        >
                          <MenuItem value="">Seçilməmiş</MenuItem>
                          {orgStructureNodes.map((node) => (
                            <MenuItem key={node.id} value={node.id}>
                              {'\u00A0'.repeat(node.depth * 2)}{node.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Rol təyin et</Typography>
                          <FormGroup row>
                            {roles.map((role) => (
                              <FormControlLabel key={role.id} control={<Switch checked={userForm.roleIds.includes(role.id)} onChange={(_, checked) => toggleUserRole(role.id, checked)} />} label={role.name} />
                            ))}
                          </FormGroup>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button disabled={isBusy} type="submit" variant="contained" startIcon={userForm.id ? <EditRounded /> : <AddRounded />} sx={{ borderRadius: 0 }}>
                            {userForm.id ? 'Yenilə' : 'Yarat'}
                          </Button>
                          <Button variant="outlined" sx={{ borderRadius: 0 }} onClick={() => { setUserForm(emptyUserForm()); setUserFormOpen(false); }}>Ləğv et</Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Table */}
                <Box sx={{ p: 0 }}>
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <PeopleAltRounded color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>İstifadəçilər</Typography>
                    <TextField
                      size="small"
                      placeholder="İstifadəçi axtar..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      sx={{ minWidth: { xs: 160, sm: 240 } }}
                    />
                    <Chip color="primary" label={`${filteredUsers.length}/${totalUsers}`} size="small" />
                  </Box>
                  {filteredUsers.length === 0 ? (
                    <EmptyState
                      title={users.length === 0 ? 'İstifadəçi tapılmadı' : 'Axtarışa uyğun istifadəçi tapılmadı'}
                      body={users.length === 0 ? 'Yeni istifadəçi əlavə etmək üçün yuxarıdakı formu açın.' : 'Axtarış mətnini dəyişərək yenidən yoxlayın.'}
                    />
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>İstifadəçi adı</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Ad Soyad</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Telefon</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Struktur bölməsi</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Son giriş</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredUsers.map((user, idx) => {
                            return (
                            <TableRow key={user.id} hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03) }}>
                              <TableCell>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'primary.main' }}>{user.username.slice(0, 1).toUpperCase()}</Avatar>
                                  <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell><Typography variant="body2" color="text.secondary">{user.fullName || '—'}</Typography></TableCell>
                              <TableCell><Typography variant="body2" color="text.secondary">{user.phoneNumber || '—'}</Typography></TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {user.organizationalStructureName || orgStructureNodes.find((n) => n.id === user.organizationalStructureId)?.name || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip color={user.isLocked ? 'warning' : 'success'} label={user.isLocked ? 'Bloklanıb' : 'Aktiv'} size="small" />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <AccessTimeRounded sx={{ fontSize: 13, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : 'Heç vaxt'}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  <Tooltip title="Düzənlə"><IconButton size="small" onClick={() => startEditingUser(user)}><EditRounded fontSize="small" /></IconButton></Tooltip>
                                  <Tooltip title="Şifrəni dəyiş">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => {
                                        setSetUserPasswordTarget(user);
                                        setSetUserPasswordForm({ newPassword: '', confirmNewPassword: '' });
                                      }}
                                    >
                                      <KeyRounded fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={user.isLocked ? 'Bloku aç' : 'Blokla'}>
                                    <IconButton size="small" onClick={() => void runAction(async () => { if (user.isLocked) { await api.unlockUser(user.id); } else { await api.lockUser(user.id); } await refreshUsers(); }, user.isLocked ? 'İstifadəçi blokdan çıxarıldı.' : 'İstifadəçi bloklandı.')}>
                                      {user.isLocked ? <LockOpenRounded fontSize="small" /> : <LockRounded fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Sil"><IconButton size="small" color="error" onClick={() => openDeleteConfirm('İstifadəçini sil', `${user.username} istifadəçisini silmək istədiyinizə əminsiniz?`, () => runAction(async () => { await api.deleteUser(user.id); await refreshUsers(); }, 'İstifadəçi silindi.'))}><DeleteRounded fontSize="small" /></IconButton></Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Stack>
            ) : null}

            {activeSection === 'roles' && sectionAccess.roles ? (
              <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Accordion
                  expanded={roleFormOpen}
                  onChange={(_, open) => { setRoleFormOpen(open); if (!open) setRoleForm(emptyRoleForm()); }}
                  disableGutters
                  sx={{ borderRadius: '0 !important', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider', mb: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ bgcolor: roleFormOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <AdminPanelSettingsRounded color="primary" />
                      {!roleForm.id ? <AddRounded color="primary" fontSize="small" /> : null}
                      <Typography fontWeight={700}>{roleForm.id ? 'Rolu düzənlə' : 'Yeni rol əlavə et'}</Typography>
                      {roleForm.id ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box component="form" onSubmit={handleRoleSubmit} sx={{ pt: 1 }}>
                      <Stack spacing={2}>
                        <TextField label="Rol adı" value={roleForm.name} onChange={(e) => setRoleForm((c) => ({ ...c, name: e.target.value }))} required fullWidth />
                        <TextField label="Açıqlama" value={roleForm.description} onChange={(e) => setRoleForm((c) => ({ ...c, description: e.target.value }))} minRows={3} multiline fullWidth />
                        <Stack direction="row" spacing={1}>
                          <Button disabled={isBusy} type="submit" variant="contained" startIcon={roleForm.id ? <EditRounded /> : <AddRounded />} sx={{ borderRadius: 0 }}>
                            {roleForm.id ? 'Yenilə' : 'Yarat'}
                          </Button>
                          <Button variant="outlined" sx={{ borderRadius: 0 }} onClick={() => { setRoleForm(emptyRoleForm()); setRoleFormOpen(false); }}>Ləğv et</Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Box>
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <AdminPanelSettingsRounded color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Rollar</Typography>
                    <TextField
                      size="small"
                      placeholder="Rol axtar..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      sx={{ minWidth: { xs: 150, sm: 220 } }}
                    />
                    <Chip label={`${filteredRoles.length}/${roles.length}`} size="small" />
                  </Box>
                  {filteredRoles.length === 0 ? (
                    <EmptyState
                      title={roles.length === 0 ? 'Hələ rol yoxdur' : 'Axtarışa uyğun rol tapılmadı'}
                      body={roles.length === 0 ? 'İcazələri və istifadəçiləri təyin etməyə başlamaq üçün rol yaradın.' : 'Axtarış mətnini dəyişərək yenidən yoxlayın.'}
                    />
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Ad</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Açıqlama</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none', width: 120 }}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredRoles.map((role, idx) => (
                            <TableRow key={role.id} hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03) }}>
                              <TableCell><Typography variant="body2" fontWeight={700}>{role.name}</Typography></TableCell>
                              <TableCell><Typography variant="body2" color="text.secondary">{role.description || '—'}</Typography></TableCell>
                              <TableCell><Chip icon={<ShieldRounded />} label={`${role.actions.length} əməliyyat`} size="small" /></TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                  <Tooltip title="Düzənlə"><IconButton size="small" onClick={() => startEditingRole(role)}><EditRounded fontSize="small" /></IconButton></Tooltip>
                                  <Tooltip title="İcazələr"><IconButton size="small" color="primary" onClick={() => { setSelectedRoleId(role.id); setActiveSection('permissions'); }}><ShieldRounded fontSize="small" /></IconButton></Tooltip>
                                  <Tooltip title="Sil"><IconButton size="small" color="error" onClick={() => openDeleteConfirm('Rolu sil', `${role.name} rolunu silmək istədiyinizə əminsiniz?`, () => runAction(async () => { await api.deleteRole(role.id); await refreshRoles(); }, 'Rol silindi.'))}><DeleteRounded fontSize="small" /></IconButton></Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Stack>
            ) : null}

            {activeSection === 'permissions' && sectionAccess.permissions ? (
              <SectionCard
                title="Rol icazələri"
                subtitle="Rol seçin, qruplaşdırılmış controller əməliyyatlarını nəzərdən keçirin, sonra yalnız dəyişiklikləri saxlayın."
                action={
                  <TextField
                    label="Rol"
                    select
                    size="small"
                    sx={{ minWidth: 220 }}
                    value={selectedRoleId}
                    onChange={(event) => setSelectedRoleId(event.target.value)}
                  >
                    <MenuItem value="">Rol seçin</MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </TextField>
                }
              >
                {!permissionMatrix ? (
                  <EmptyState
                    title="Rol seçin"
                    body="Rol seçildikdən sonra controller əməliyyatları asanlıqla nəzərdən keçirmək üçün qruplaşdırılmış akkordeonlarda görünür."
                  />
                ) : (
                  <>
                    <Alert severity="info">
                      {permissionMatrix.roleName} hazırda {originalAssignedIds.size} təyin edilmiş əməliyyata malikdir. Girişi vermək və ya ləğv etmək üçün aşağıdakı qruplaşdırılmış açarlardan istifadə edin.
                    </Alert>
                    <Stack spacing={1.5}>
                      {permissionMatrix.controllers.map((controller) => (
                        <Accordion key={controller.controllerId} disableGutters sx={{ borderRadius: '16px !important', overflow: 'hidden' }}>
                          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Typography fontWeight={600}>
                                {controller.description?.trim() || controller.controllerName}
                              </Typography>
                              <Chip label={`${controller.actions.filter((item) => selectedActionIds.has(item.actionId)).length}/${controller.actions.length}`} size="small" />
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1}>
                              {controller.actions.map((action) => {
                                const checked = selectedActionIds.has(action.actionId);
                                return (
                                  <Paper key={action.actionId} sx={{ p: 1.5, borderRadius: 2.5 }} variant="outlined">
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                                      <Box>
                                        <Typography fontWeight={600} variant="body2">
                                          {action.description || action.actionName}
                                        </Typography>
                                        <Typography color="text.secondary" variant="body2">
                                          {action.httpMethod} {action.route}
                                        </Typography>
                                      </Box>
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={checked}
                                            onChange={(_, nextChecked) =>
                                              setSelectedActionIds((current) => {
                                                const next = new Set(current);
                                                if (nextChecked) {
                                                  next.add(action.actionId);
                                                } else {
                                                  next.delete(action.actionId);
                                                }
                                                return next;
                                              })
                                            }
                                          />
                                        }
                                        label={checked ? 'İcazə verildi' : 'Bloklandı'}
                                      />
                                    </Stack>
                                  </Paper>
                                );
                              })}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Stack>
                    <Button
                      disabled={isBusy || !selectedRoleId}
                      onClick={() =>
                        void runAction(async () => {
                          const grantActionIds = [...selectedActionIds].filter((id) => !originalAssignedIds.has(id));
                          const revokeActionIds = [...originalAssignedIds].filter((id) => !selectedActionIds.has(id));

                          await api.updateRolePermissions(selectedRoleId, { grantActionIds, revokeActionIds });
                          await loadRoleMatrix(selectedRoleId);
                          await refreshRoles();
                        }, 'Rol icazələri yeniləndi.')
                      }
                      startIcon={<ShieldRounded />}
                      variant="contained"
                    >
                      İcazə dəyişikliklərini saxla
                    </Button>
                  </>
                )}
              </SectionCard>
            ) : null}

            {activeSection === 'fileProcessings' && sectionAccess.fileProcessings ? (
              <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                  <FolderSpecialRounded color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Fayl emalları</Typography>
                  <TextField
                    size="small"
                    placeholder="Sənəd və ya fayl axtar..."
                    value={fileProcessingSearchInput}
                    onChange={(e) => setFileProcessingSearchInput(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setFileProcessingPage(0);
                        setFileProcessingQuery(fileProcessingSearchInput.trim());
                      }
                    }}
                    sx={{ minWidth: { xs: 180, sm: 240 } }}
                  />
                  <TextField
                    size="small"
                    select
                    label="Status"
                    value={fileProcessingStatusFilter}
                    onChange={(event) => {
                      const next = event.target.value;
                      setFileProcessingPage(0);
                      setFileProcessingStatusFilter(next === 'all' ? 'all' : Number(next));
                    }}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="all">Hamısı</MenuItem>
                    {fileProcessingStatuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    sx={{ borderRadius: 0 }}
                    onClick={() => {
                      setFileProcessingPage(0);
                      setFileProcessingQuery(fileProcessingSearchInput.trim());
                    }}
                  >
                    Axtar
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ borderRadius: 0 }}
                    startIcon={<RefreshRounded />}
                    disabled={isFileProcessingLoading}
                    onClick={() => void loadFileProcessings()}
                  >
                    Yenilə
                  </Button>
                  <Chip label={`${fileProcessings.length}/${fileProcessingTotal}`} size="small" />
                </Box>

                {isFileProcessingLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : fileProcessings.length === 0 ? (
                  <EmptyState
                    title="Fayl emalı tapılmadı"
                    body="Axtarış və filtr parametrlərini dəyişib yenidən yoxlayın."
                  />
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sənəd</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Fayl</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Mövcud status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Yeni status</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Emal tarixi</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fileProcessings.map((item, idx) => {
                            const currentStatusValue = fileProcessingStatusValueByName[item.status];
                            const draftStatusValue = statusDraftById[item.id] ?? currentStatusValue;
                            const isChanged = currentStatusValue !== draftStatusValue;

                            return (
                              <TableRow key={item.id} hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03) }}>
                                <TableCell>
                                  <Stack spacing={0.25}>
                                    <Typography variant="body2" fontWeight={700}>{item.documentTitle}</Typography>
                                    <Typography variant="caption" color="text.secondary">{item.baseDocumentNumber || 'Əsas sənəd yoxdur'}</Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Stack spacing={0.25}>
                                    <Typography variant="body2" fontWeight={600}>{item.fileName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{item.mimeType}</Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={fileProcessingStatusLabelByName[item.status]}
                                    color={item.status === 'Failed' ? 'error' : item.status === 'Completed' || item.status === 'Indexed' ? 'success' : item.status === 'Processing' ? 'warning' : 'default'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    select
                                    value={draftStatusValue}
                                    onChange={(event) =>
                                      setStatusDraftById((current) => ({
                                        ...current,
                                        [item.id]: Number(event.target.value)
                                      }))
                                    }
                                    sx={{ minWidth: 150 }}
                                  >
                                    {fileProcessingStatuses.map((status) => (
                                      <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                                    ))}
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.processedDate ? new Date(item.processedDate).toLocaleString() : '—'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <Tooltip title="OCR mətnini göstər">
                                      <IconButton size="small" onClick={() => void openOcrPreview(item)}>
                                        <VisibilityRounded fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      sx={{ borderRadius: 0 }}
                                      disabled={!isChanged || savingStatusId === item.id}
                                      onClick={() => void saveFileProcessingStatus(item.id)}
                                    >
                                      Saxla
                                    </Button>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      labelRowsPerPage="Səhifə üzrə sətir sayı:"
                      labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count !== -1 ? count : `>${to}`}`}
                      count={fileProcessingTotal}
                      page={fileProcessingPage}
                      onPageChange={(_, nextPage) => setFileProcessingPage(nextPage)}
                      rowsPerPage={fileProcessingPageSize}
                      onRowsPerPageChange={(event) => {
                        setFileProcessingPageSize(Number(event.target.value));
                        setFileProcessingPage(0);
                      }}
                      rowsPerPageOptions={[10, 20, 50]}
                    />
                  </>
                )}
              </Stack>
            ) : null}

            {activeSection === 'documentTypes' && sectionAccess.documentTypes ? (
              <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {/* Accordion: create/edit doc type + embedded references */}
                <Accordion
                  expanded={docTypeFormOpen}
                  onChange={(_, open) => { setDocTypeFormOpen(open); if (!open) { setDocumentTypeForm(emptyDocumentTypeForm()); setDocTypeRefFormOpen(false); } }}
                  disableGutters
                  sx={{ borderRadius: '0 !important', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider', mb: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ bgcolor: docTypeFormOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <DescriptionRounded color="primary" />
                      {!documentTypeForm.id ? <AddRounded color="primary" fontSize="small" /> : null}
                      <Typography fontWeight={700}>{documentTypeForm.id ? 'Sənəd növünü düzənlə' : 'Yeni sənəd növü əlavə et'}</Typography>
                      {documentTypeForm.id ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box component="form" onSubmit={handleDocumentTypeSubmit} sx={{ pt: 1 }}>
                      <Stack spacing={2}>
                        <TextField label="Ad" value={documentTypeForm.name} onChange={(e) => setDocumentTypeForm((c) => ({ ...c, name: e.target.value }))} required fullWidth />
                        <TextField label="Açıqlama" value={documentTypeForm.description} onChange={(e) => setDocumentTypeForm((c) => ({ ...c, description: e.target.value }))} minRows={2} multiline fullWidth />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                          <TextField
                            label="İndeks"
                            type="number"
                            value={documentTypeForm.index}
                            onChange={(e) => setDocumentTypeForm((c) => ({ ...c, index: Number(e.target.value) }))}
                            inputProps={{ min: 1 }}
                            required
                            fullWidth
                          />
                          <TextField
                            label="Sayğac"
                            type="number"
                            value={documentTypeForm.counter}
                            onChange={(e) => setDocumentTypeForm((c) => ({ ...c, counter: Number(e.target.value) }))}
                            inputProps={{ min: 0 }}
                            required
                            fullWidth
                          />
                          <TextField
                            label="Saxlama müddəti (ay)"
                            type="number"
                            value={documentTypeForm.retentionMonth}
                            onChange={(e) => setDocumentTypeForm((c) => ({ ...c, retentionMonth: Number(e.target.value) }))}
                            inputProps={{ min: 1 }}
                            required
                            fullWidth
                          />
                        </Box>

                        {/* Embedded references */}
                        <Divider />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle2" fontWeight={700}>İstinad sahələri</Typography>
                          <Button size="small" startIcon={<AddRounded />} variant="outlined" sx={{ borderRadius: 0 }}
                            onClick={() => { setDocTypeRefForm(emptyEmbeddedRef()); setEditingDocTypeRefIdx(null); setDocTypeRefFormOpen(true); }}>
                            Yeni istinad
                          </Button>
                        </Stack>

                        {/* Inline ref edit form */}
                        <Collapse in={docTypeRefFormOpen} unmountOnExit>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, bgcolor: 'background.paper' }}>
                            <Stack spacing={2}>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <TextField size="small" label="Ad" value={docTypeRefForm.name} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, name: e.target.value }))} required fullWidth />
                                <TextField
                                  size="small"
                                  label="Sütun növü"
                                  select
                                  value={columnTypeOptions.some((o) => o.value === docTypeRefForm.columnType) ? docTypeRefForm.columnType : ''}
                                  onChange={(e) => setDocTypeRefForm((c) => ({ ...c, columnType: e.target.value === '' ? 0 : Number(e.target.value) }))}
                                  fullWidth
                                >
                                  <MenuItem value="">Seçin</MenuItem>
                                  {columnTypeOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                                </TextField>
                              </Box>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                                <TextField size="small" label="Göstərmə sırası" type="number" value={docTypeRefForm.displayOrder} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, displayOrder: Number(e.target.value) }))} inputProps={{ min: 1 }} fullWidth />
                                <TextField size="small" label="Yer tutucu" value={docTypeRefForm.placeholder} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, placeholder: e.target.value }))} fullWidth />
                                <TextField size="small" label="Yardım mətni" value={docTypeRefForm.helpText} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, helpText: e.target.value }))} fullWidth />
                              </Box>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <TextField size="small" label="Doğrulama regex" value={docTypeRefForm.validationRegex} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, validationRegex: e.target.value }))} fullWidth />
                                <FormControlLabel control={<Switch checked={docTypeRefForm.isRequired} onChange={(_, v) => setDocTypeRefForm((c) => ({ ...c, isRequired: v }))} size="small" />} label="Məcburi sahə" sx={{ m: 0 }} />
                              </Box>

                              {/* Dropdown options */}
                              {docTypeRefForm.columnType === 6 ? (
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, bgcolor: alpha('#0057B8', 0.02) }}>
                                  <Stack spacing={1.5}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                      <Typography variant="caption" fontWeight={700}>Açılan menyu seçimləri</Typography>
                                      <Button size="small" startIcon={<PlaylistAddRounded />} variant="text" sx={{ borderRadius: 0 }}
                                        onClick={() => setDocTypeRefForm((c) => ({ ...c, options: [...c.options, { value: '', label: '', displayOrder: c.options.length + 1, isActive: true }] }))}>
                                        Seçim əlavə et
                                      </Button>
                                    </Stack>
                                    {docTypeRefForm.options.map((opt, i) => (
                                      <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: 1, alignItems: 'center' }}>
                                        <TextField size="small" label="Dəyər" value={opt.value} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, options: c.options.map((o, j) => j === i ? { ...o, value: e.target.value } : o) }))} fullWidth />
                                        <TextField size="small" label="Etiket" value={opt.label} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, options: c.options.map((o, j) => j === i ? { ...o, label: e.target.value } : o) }))} fullWidth />
                                        <TextField size="small" label="Sıra" type="number" value={opt.displayOrder} onChange={(e) => setDocTypeRefForm((c) => ({ ...c, options: c.options.map((o, j) => j === i ? { ...o, displayOrder: Number(e.target.value) } : o) }))} fullWidth />
                                        <IconButton size="small" color="error" onClick={() => setDocTypeRefForm((c) => ({ ...c, options: c.options.filter((_, j) => j !== i) }))}><DeleteRounded fontSize="small" /></IconButton>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Paper>
                              ) : null}

                              <Stack direction="row" spacing={1}>
                                <Button size="small" variant="contained" sx={{ borderRadius: 0 }}
                                  onClick={() => {
                                    if (!docTypeRefForm.name.trim()) return;
                                    if (editingDocTypeRefIdx !== null) {
                                      setDocumentTypeForm((c) => ({ ...c, refs: c.refs.map((r, i) => i === editingDocTypeRefIdx ? docTypeRefForm : r) }));
                                    } else {
                                      setDocumentTypeForm((c) => ({ ...c, refs: [...c.refs, docTypeRefForm] }));
                                    }
                                    setDocTypeRefFormOpen(false);
                                    setEditingDocTypeRefIdx(null);
                                    setDocTypeRefForm(emptyEmbeddedRef());
                                  }}>
                                  {editingDocTypeRefIdx !== null ? 'Yenilə' : 'Əlavə et'}
                                </Button>
                                <Button size="small" variant="outlined" sx={{ borderRadius: 0 }} onClick={() => { setDocTypeRefFormOpen(false); setEditingDocTypeRefIdx(null); setDocTypeRefForm(emptyEmbeddedRef()); }}>Ləğv et</Button>
                              </Stack>
                            </Stack>
                          </Paper>
                        </Collapse>

                        {/* Refs list inside form */}
                        {documentTypeForm.refs.length > 0 ? (
                          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: alpha('#0057B8', 0.08) }}>
                                  <TableCell sx={{ fontWeight: 700 }}>Ad</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Növ</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Sıra</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700 }}></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {documentTypeForm.refs.map((ref, i) => (
                                  <TableRow key={i} hover>
                                    <TableCell><Typography variant="body2" fontWeight={600}>{ref.name}</Typography></TableCell>
                                    <TableCell><Chip label={columnTypeOptions.find((o) => o.value === ref.columnType)?.label ?? ref.columnType} size="small" /></TableCell>
                                    <TableCell>{ref.displayOrder}</TableCell>
                                    <TableCell><Chip label={ref.isRequired ? 'Məcburi' : 'İstəyə bağlı'} size="small" color={ref.isRequired ? 'primary' : 'default'} /></TableCell>
                                    <TableCell align="right">
                                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => { setDocTypeRefForm(ref); setEditingDocTypeRefIdx(i); setDocTypeRefFormOpen(true); }}><EditRounded fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => setDocumentTypeForm((c) => ({ ...c, refs: c.refs.filter((_, j) => j !== i) }))}><DeleteRounded fontSize="small" /></IconButton>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary">Hələ istinad sahəsi əlavə edilməyib.</Typography>
                        )}

                        <Divider />
                        <Stack direction="row" spacing={1}>
                          <Button disabled={isBusy} type="submit" variant="contained" startIcon={documentTypeForm.id ? <EditRounded /> : <AddRounded />} sx={{ borderRadius: 0 }}>
                            {documentTypeForm.id ? 'Yenilə' : 'Yarat'}
                          </Button>
                          <Button variant="outlined" sx={{ borderRadius: 0 }} onClick={() => { setDocumentTypeForm(emptyDocumentTypeForm()); setDocTypeFormOpen(false); setDocTypeRefFormOpen(false); }}>Ləğv et</Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Document types table with expandable reference rows */}
                <Box>
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <FolderSpecialRounded color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Sənəd növləri</Typography>
                    <TextField
                      size="small"
                      placeholder="Sənəd növü axtar..."
                      value={docTypeSearch}
                      onChange={(e) => setDocTypeSearch(e.target.value)}
                      sx={{ minWidth: { xs: 170, sm: 240 } }}
                    />
                    <Chip label={`${filteredDocumentTypes.length}/${documentTypes.length}`} size="small" />
                  </Box>
                  {filteredDocumentTypes.length === 0 ? (
                    <EmptyState
                      title={documentTypes.length === 0 ? 'Sənəd növü yoxdur' : 'Axtarışa uyğun sənəd növü tapılmadı'}
                      body={documentTypes.length === 0 ? 'Yuxarıdakı formu açaraq ilk sənəd növünü yaradın.' : 'Axtarış mətnini dəyişərək yenidən yoxlayın.'}
                    />
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ width: 44, color: 'white', fontWeight: 700, borderBottom: 'none' }} />
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Ad</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Açıqlama</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>İndeks</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sayğac</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Saxlama (ay)</TableCell>
                            <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none', width: 90 }}>Əməliyyatlar</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredDocumentTypes.map((item, idx) => (
                            <React.Fragment key={item.id}>
                              <TableRow hover sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03) }}>
                                <TableCell sx={{ py: 0.5 }}>
                                  <Tooltip title={expandedDocTypeId === item.id ? 'Bağla' : 'İstinadları göstər'}>
                                    <IconButton size="small" onClick={() => void toggleExpandDocType(item.id)}>
                                      {loadingExpandedRefs && expandedDocTypeId === item.id
                                        ? <CircularProgress size={16} />
                                        : <ExpandMoreRounded fontSize="small" sx={{ transform: expandedDocTypeId === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                      }
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                                <TableCell><Typography variant="body2" fontWeight={700}>{item.name}</Typography></TableCell>
                                <TableCell><Typography variant="body2" color="text.secondary">{item.description || '—'}</Typography></TableCell>
                                <TableCell><Chip label={item.index} size="small" variant="outlined" /></TableCell>
                                <TableCell><Chip label={item.counter} size="small" variant="outlined" /></TableCell>
                                <TableCell><Chip label={`${item.retentionMonth} ay`} size="small" icon={<AccessTimeRounded />} /></TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                    <Tooltip title="Düzənlə"><IconButton size="small" onClick={() => void startEditingDocumentType(item)}><EditRounded fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="Sil"><IconButton size="small" color="error" onClick={() => openDeleteConfirm('Sənəd növünü sil', `${item.name} sənəd növünü silmək istədiyinizə əminsiniz?`, () => runAction(async () => { await api.deleteDocumentType(item.id); await refreshDocumentTypes(); if (expandedDocTypeId === item.id) setExpandedDocTypeId(null); }, 'Sənəd növü silindi.'))}><DeleteRounded fontSize="small" /></IconButton></Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
                                  <Collapse in={expandedDocTypeId === item.id} unmountOnExit>
                                    <Box sx={{ px: 3, py: 2, bgcolor: alpha('#0057B8', 0.02), borderBottom: '1px solid', borderColor: 'divider' }}>
                                      {loadingExpandedRefs ? (
                                        <CircularProgress size={20} />
                                      ) : expandedDocTypeRefs.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">Bu sənəd növü üçün istinad sahəsi yoxdur. Düzənlə düyməsinə basaraq əlavə edin.</Typography>
                                      ) : (
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow sx={{ bgcolor: alpha('#0057B8', 0.06) }}>
                                              <TableCell sx={{ fontWeight: 700 }}>Ad</TableCell>
                                              <TableCell sx={{ fontWeight: 700 }}>Növ</TableCell>
                                              <TableCell sx={{ fontWeight: 700 }}>Sıra</TableCell>
                                              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                              <TableCell sx={{ fontWeight: 700 }}>Seçimlər</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {expandedDocTypeRefs.map((ref) => (
                                              <TableRow key={ref.id} hover>
                                                <TableCell>
                                                  <Typography variant="body2" fontWeight={600}>{ref.name}</Typography>
                                                  {(ref.helpText || ref.placeholder) ? <Typography variant="caption" color="text.secondary">{ref.helpText || ref.placeholder}</Typography> : null}
                                                </TableCell>
                                                <TableCell><Chip label={ref.columnType} size="small" /></TableCell>
                                                <TableCell><Typography variant="body2">{ref.displayOrder}</Typography></TableCell>
                                                <TableCell><Chip color={ref.isRequired ? 'primary' : 'default'} label={ref.isRequired ? 'Məcburi' : 'İstəyə bağlı'} size="small" variant={ref.isRequired ? 'filled' : 'outlined'} /></TableCell>
                                                <TableCell>
                                                  {ref.options.length > 0 ? (
                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                      {ref.options.map((o) => <Chip key={`${ref.id}-${o.label}`} label={o.label} size="small" variant="outlined" />)}
                                                    </Stack>
                                                  ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Stack>
            ) : null}

            {activeSection === 'userDocumentTypeAccess' && sectionAccess.userDocumentTypeAccess ? (
              <UserDocumentTypeAccessPage
                users={users}
                documentTypes={documentTypes}
                isBusy={isBusy}
              />
            ) : null}

            {activeSection === 'baseDocuments' && sectionAccess.baseDocuments ? (
              <Stack spacing={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Accordion
                  expanded={baseDocumentFormOpen}
                  onChange={(_, open) => {
                    setBaseDocumentFormOpen(open);
                    if (!open) {
                      setBaseDocumentForm(emptyBaseDocumentForm());
                      setBaseDocumentFormUpload({ files: [], isOriginal: true });
                      setBaseDocumentFormExistingFiles([]);
                    }
                  }}
                  disableGutters
                  sx={{ borderRadius: '0 !important', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider', mb: 2, '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ bgcolor: baseDocumentFormOpen ? alpha('#0057B8', 0.04) : 'background.paper', minHeight: 56 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <TopicRounded color="primary" />
                      {!baseDocumentForm.id ? <AddRounded color="primary" fontSize="small" /> : null}
                      <Typography fontWeight={700}>{baseDocumentForm.id ? 'Qərar sənədini düzənlə' : 'Yeni qərar sənədi əlavə et'}</Typography>
                      {baseDocumentForm.id ? <Chip label="Düzəniş rejimi" size="small" color="primary" /> : null}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box component="form" onSubmit={handleBaseDocumentSubmit} sx={{ pt: 1 }}>
                      <Stack spacing={2}>
                        <TextField
                          label="Sənəd nömrəsi"
                          required
                          value={baseDocumentForm.documentNumber}
                          onChange={(e) => setBaseDocumentForm((c) => ({ ...c, documentNumber: e.target.value }))}
                          fullWidth
                        />
                        <TextField
                          label="Sənəd tarixi"
                          type="date"
                          required
                          value={baseDocumentForm.documentDate}
                          onChange={(e) => setBaseDocumentForm((c) => ({ ...c, documentDate: e.target.value }))}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                        <TextField
                          label="Açıqlama"
                          value={baseDocumentForm.description}
                          onChange={(e) => setBaseDocumentForm((c) => ({ ...c, description: e.target.value }))}
                          minRows={2}
                          multiline
                          fullWidth
                        />
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, bgcolor: 'background.paper' }}>
                          <Stack spacing={1.5}>
                            <Typography variant="body2" fontWeight={700}>Qərar sənədi ilə birlikdə fayllar əlavə et</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Eyni formda sənədi yaradın və seçdiyiniz bir və ya bir neçə faylı birbaşa ona bağlayın.
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
                                    setBaseDocumentFormUpload((current) => ({ ...current, files: appendSelectedFiles(current.files, files) }));
                                    event.currentTarget.value = '';
                                  }}
                                />
                              </Button>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={baseDocumentFormUpload.isOriginal}
                                    onChange={(_, checked) => setBaseDocumentFormUpload((current) => ({ ...current, isOriginal: checked }))}
                                    size="small"
                                  />
                                }
                                label="Original fayl"
                                sx={{ m: 0 }}
                              />
                            </Stack>
                            {baseDocumentFormUpload.files.length > 0 ? (
                              <Stack spacing={1}>
                                <Chip size="small" color="primary" variant="outlined" label={`${baseDocumentFormUpload.files.length} fayl seçildi`} sx={{ width: 'fit-content' }} />
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                {baseDocumentFormUpload.files.map((file) => (
                                  <Chip
                                    key={`${file.name}-${file.size}-${file.lastModified}`}
                                    size="small"
                                    label={file.name}
                                    onDelete={() => setBaseDocumentFormUpload((current) => ({
                                      ...current,
                                      files: current.files.filter((candidate) => !(candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified))
                                    }))}
                                  />
                                ))}
                                </Stack>
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                İstəyə görə bir və ya bir neçə fayl əlavə edə bilərsiniz.
                              </Typography>
                            )}

                            {baseDocumentFormExistingFiles.length > 0 && (
                              <Stack spacing={1} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight={600}>Mövcud Fayllar</Typography>
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                  {baseDocumentFormExistingFiles.map((file) => (
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
                                              await api.deleteBaseDocumentFile(file.id);
                                              setBaseDocumentFormExistingFiles((current) => current.filter((f) => f.id !== file.id));
                                            }, 'Fayl silindi.')
                                        )
                                      }
                                    />
                                  ))}
                                </Stack>
                              </Stack>
                            )}
                          </Stack>
                        </Paper>
                        <Stack direction="row" spacing={1}>
                          <Button disabled={isBusy} type="submit" variant="contained" startIcon={baseDocumentForm.id ? <EditRounded /> : <AddRounded />}>
                            {baseDocumentForm.id ? 'Yenilə' : 'Yarat'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setBaseDocumentForm(emptyBaseDocumentForm());
                              setBaseDocumentFormUpload({ files: [], isOriginal: true });
                              setBaseDocumentFormExistingFiles([]);
                              setBaseDocumentFormOpen(false);
                            }}
                          >
                            Ləğv et
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Box>
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                    <TopicRounded color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>Qərar sənədləri</Typography>
                    <TextField
                      size="small"
                      placeholder="Sənəd nömrəsi ilə axtar..."
                      value={baseDocumentSearchInput}
                      onChange={(e) => setBaseDocumentSearchInput(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          setBaseDocumentPage(0);
                          setBaseDocumentQuery(baseDocumentSearchInput.trim());
                        }
                      }}
                      sx={{ minWidth: { xs: 180, sm: 240 } }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setBaseDocumentPage(0);
                        setBaseDocumentQuery(baseDocumentSearchInput.trim());
                      }}
                    >
                      Axtar
                    </Button>
                    <Chip label={`${baseDocuments.length}/${baseDocumentTotal}`} size="small" />
                  </Box>

                  {isBaseDocumentsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : baseDocuments.length === 0 ? (
                    <EmptyState
                      title="Qərar sənədi tapılmadı"
                      body="Yeni qərar sənədi əlavə edin və ya axtarış filtrini dəyişin."
                    />
                  ) : (
                    <>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.main' }}>
                              <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sənəd nömrəsi</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sənəd tarixi</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Açıqlama</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Sayğaclar</TableCell>
                              <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Əməliyyatlar</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {baseDocuments.map((item, idx) => {
                              const isFilesExpanded = baseDocumentFilesDialog.documentId === item.id;
                              return (
                                <React.Fragment key={item.id}>
                                  <TableRow
                                    hover
                                    sx={{
                                      bgcolor: isFilesExpanded ? alpha('#0057B8', 0.06) : idx % 2 === 0 ? 'background.paper' : alpha('#0057B8', 0.03),
                                      '& .MuiTableCell-root': { borderBottomColor: isFilesExpanded ? 'transparent' : alpha('#0057B8', 0.12) }
                                    }}
                                  >
                                    <TableCell><Typography variant="body2" fontWeight={700}>{item.documentNumber}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{new Date(item.documentDate).toLocaleDateString()}</Typography></TableCell>
                                    <TableCell><Typography variant="body2" color="text.secondary">{item.description || '—'}</Typography></TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={0.75}>
                                        <Chip size="small" label={`${item.fileCount} fayl`} />
                                        <Chip size="small" label={`${item.documentCount} sənəd`} variant="outlined" />
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title={isFilesExpanded ? 'Faylları gizlət' : 'Faylları göstər'}>
                                          <IconButton size="small" color={isFilesExpanded ? 'primary' : 'default'} onClick={() => void openBaseDocumentFiles(item)}>
                                            <AttachFileRounded fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Düzənlə">
                                          <IconButton size="small" onClick={() => startEditingBaseDocument(item)}>
                                            <EditRounded fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Sil">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() =>
                                              openDeleteConfirm(
                                                'Qərar sənədini sil',
                                                `${item.documentNumber} nömrəli qərar sənədini silmək istədiyinizə əminsiniz?`,
                                                () =>
                                                  runAction(async () => {
                                                    await api.deleteBaseDocument(item.id);
                                                    await refreshBaseDocuments();
                                                  }, 'Qərar sənədi silindi.')
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
                                    <TableCell colSpan={5} sx={{ p: 0, borderBottom: isFilesExpanded ? `1px solid ${alpha('#0057B8', 0.12)}` : 'none' }}>
                                      <Collapse in={isFilesExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ bgcolor: alpha('#0057B8', 0.02), borderTop: '1px solid', borderColor: alpha('#0057B8', 0.12) }}>
                                          {baseDocumentFilesDialog.isLoading ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                              <CircularProgress size={24} />
                                            </Box>
                                          ) : baseDocumentFilesDialog.files.length === 0 ? (
                                            <Box sx={{ py: 2.5, textAlign: 'center' }}>
                                              <Typography variant="body2" color="text.secondary">Bu sənədə əlavə edilmiş fayl yoxdur.</Typography>
                                            </Box>
                                          ) : (
                                            <List disablePadding dense>
                                              {baseDocumentFilesDialog.files.map((file, fileIdx) => {
                                                const isPdf = file.mimeType === 'application/pdf' || file.fileName.toLowerCase().endsWith('.pdf');
                                                const isImage = isImageFile(file.mimeType, file.fileName);
                                                const isPreviewable = isPdf || isImage;
                                                const isActivePreview = baseDocumentFilesDialog.pdfPreviewFileId === file.id;
                                                return (
                                                  <React.Fragment key={file.id}>
                                                    {fileIdx > 0 && <Divider />}
                                                    <ListItemButton
                                                      selected={isActivePreview}
                                                      sx={{ px: 3, py: 1 }}
                                                      onClick={() => { if (isPreviewable) void handleBaseDocumentFilePreview(file.id, file.fileName); }}
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
                                                            {file.isOriginal && <Chip label="Original" size="small" color="primary" variant="outlined" />}
                                                          </Stack>
                                                        }
                                                        secondary={`${(file.fileSize / 1024).toFixed(1)} KB · ${new Date(file.uploadedDate).toLocaleString()}`}
                                                      />
                                                      <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                                                        {isPreviewable && (
                                                          <Tooltip title="Öncədən bax">
                                                            <IconButton size="small" color={isActivePreview ? 'error' : 'default'} onClick={() => void handleBaseDocumentFilePreview(file.id, file.fileName)}>
                                                              <VisibilityRounded fontSize="small" />
                                                            </IconButton>
                                                          </Tooltip>
                                                        )}
                                                        <Tooltip title="Yüklə">
                                                          <IconButton size="small" color="primary" onClick={() => void handleBaseDocumentFileDownload(file.id, file.fileName)}>
                                                            <DownloadRounded fontSize="small" />
                                                          </IconButton>
                                                        </Tooltip>
                                                      </Stack>
                                                    </ListItemButton>
                                                    {isActivePreview && baseDocumentFilesDialog.pdfBlobUrl && (
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
                                                              onClick={() => setBaseDocumentFilesDialog((current) => ({ ...current, pdfMaximized: true }))}
                                                            >
                                                              <FullscreenRounded fontSize="small" />
                                                            </IconButton>
                                                          </Tooltip>
                                                          <Tooltip title="Bağla">
                                                            <IconButton
                                                              size="small"
                                                              onClick={() => setBaseDocumentFilesDialog((current) => ({ ...current, pdfPreviewFileId: null, pdfBlobUrl: null, pdfMaximized: false }))}
                                                            >
                                                              <CloseRounded fontSize="small" />
                                                            </IconButton>
                                                          </Tooltip>
                                                        </Stack>
                                                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                                                          {isPdf ? (
                                                            <iframe
                                                              src={baseDocumentFilesDialog.pdfBlobUrl ?? undefined}
                                                              title={file.fileName}
                                                              style={{ width: '100%', height: '100%', border: 'none' }}
                                                            />
                                                          ) : (
                                                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                                              <img
                                                                src={baseDocumentFilesDialog.pdfBlobUrl ?? undefined}
                                                                alt={file.fileName}
                                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                              />
                                                            </Box>
                                                          )}
                                                        </Box>
                                                      </Box>
                                                    )}

                                                    <Dialog
                                                      open={baseDocumentFilesDialog.pdfMaximized && !!baseDocumentFilesDialog.pdfBlobUrl}
                                                      onClose={() => setBaseDocumentFilesDialog((current) => ({ ...current, pdfMaximized: false }))}
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
                                                              onClick={() => setBaseDocumentFilesDialog((current) => ({ ...current, pdfMaximized: false }))}
                                                            >
                                                              <FullscreenExitRounded />
                                                            </IconButton>
                                                          </Tooltip>
                                                          <Tooltip title="Bağla">
                                                            <IconButton
                                                              size="small"
                                                              onClick={() => setBaseDocumentFilesDialog((current) => ({ ...current, pdfPreviewFileId: null, pdfBlobUrl: null, pdfMaximized: false }))}
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
                                                            src={baseDocumentFilesDialog.pdfBlobUrl ?? undefined}
                                                            title={file.fileName}
                                                            style={{ width: '100%', height: '100%', border: 'none' }}
                                                          />
                                                        ) : (
                                                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: 'grey.100' }}>
                                                            <img
                                                              src={baseDocumentFilesDialog.pdfBlobUrl ?? undefined}
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
                        count={baseDocumentTotal}
                        page={baseDocumentPage}
                        onPageChange={(_, nextPage) => setBaseDocumentPage(nextPage)}
                        rowsPerPage={baseDocumentPageSize}
                        onRowsPerPageChange={(event) => {
                          setBaseDocumentPageSize(Number(event.target.value));
                          setBaseDocumentPage(0);
                        }}
                        rowsPerPageOptions={[10, 20, 50]}
                      />
                    </>
                  )}
                </Box>
              </Stack>
            ) : null}

            {activeSection === 'documents' && sectionAccess.documents ? (
              <DocumentsPage
                isBusy={isBusy}
                runAction={runAction}
                setNotice={setNotice}
              />
            ) : null}

            {activeSection === 'documentMovements' && sectionAccess.documentMovements ? (
              <DocumentMovementsPage
                isBusy={isBusy}
                runAction={runAction}
                setNotice={setNotice}
              />
            ) : null}

            {activeSection === 'advancedSearch' && sectionAccess.advancedSearch ? (
              <AdvancedSearchPage
                setNotice={setNotice}
                onGoToDocument={(documentId) => {
                  setActiveSection('documents');
                }}
              />
            ) : null}

            {activeSection === 'locations' && sectionAccess.locations ? (
              <LocationsPage />
            ) : null}

            {activeSection === 'organizationStructure' && sectionAccess.organizationStructure ? (
              <OrganizationStructurePage onOpenTypesPage={() => setActiveSection('organizationStructureTypes')} />
            ) : null}

            {activeSection === 'organizationStructureTypes' && sectionAccess.organizationStructureTypes ? (
              <OrganizationStructureTypesPage />
            ) : null}

            {!hasAnyAccessibleSection ? (
              <Alert severity="warning">
                Bu istifadəçi üçün heç bir səhifə icazəsi tapılmadı.
              </Alert>
            ) : null}
          </Stack>
        </Container>
      </Box>

      <Dialog
        open={Boolean(setUserPasswordTarget)}
        onClose={() => {
          setSetUserPasswordTarget(null);
          setSetUserPasswordForm({ newPassword: '', confirmNewPassword: '' });
        }}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleAdminSetUserPassword}>
          <DialogTitle>
            İstifadəçi şifrəsi dəyişdir
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Hədəf istifadəçi: {setUserPasswordTarget?.username || '—'}
              </Typography>
              <TextField
                label="Yeni şifrə"
                type="password"
                required
                value={setUserPasswordForm.newPassword}
                onChange={(event) => setSetUserPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                helperText="Minimum 8 simvol, ən az 1 böyük hərf və 1 rəqəm"
                fullWidth
              />
              <TextField
                label="Yeni şifrə təkrarı"
                type="password"
                required
                value={setUserPasswordForm.confirmNewPassword}
                onChange={(event) => setSetUserPasswordForm((current) => ({ ...current, confirmNewPassword: event.target.value }))}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setSetUserPasswordTarget(null);
                setSetUserPasswordForm({ newPassword: '', confirmNewPassword: '' });
              }}
            >
              Ləğv et
            </Button>
            <Button type="submit" variant="contained" disabled={isBusy || !setUserPasswordTarget}>Yadda saxla</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={ocrPreview.open}
        onClose={() => setOcrPreview((current) => ({ ...current, open: false }))}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>OCR mətni: {ocrPreview.fileName}</DialogTitle>
        <DialogContent dividers>
          {ocrPreview.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {ocrPreview.text || 'OCR mətni yoxdur.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOcrPreview((current) => ({ ...current, open: false }))}>Bağla</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        autoHideDuration={4000}
        open={Boolean(notice)}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notice ? <Alert severity={notice.tone}>{notice.message}</Alert> : <span />}
      </Snackbar>

      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.title}
        message={confirmDelete.message}
        loading={confirmingDelete}
        onCancel={() => setConfirmDelete({ open: false, title: '', message: '', onConfirm: null })}
        onConfirm={() => void handleConfirmDelete()}
      />
    </Box>
  );
}
