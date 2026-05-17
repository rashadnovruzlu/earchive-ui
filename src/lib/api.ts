import type {
  AdvancedDocumentSearchParams,
  AdvancedDocumentSearchResult,
  ApiResponse,
  ArchiveDocumentPayload,
  AssignRolesPayload,
  BaseDocument,
  BaseDocumentDetail,
  BaseDocumentSearchParams,
  ChangeOwnPasswordPayload,
  CreateDocumentPayload,
  CreateBaseDocumentPayload,
  CreateLogicalLocationPayload,
  CreatePhysicalLocationPayload,
  CreateUserPayload,
  Document,
  DocumentDetail,
  DocumentFile,
  DocumentFileProcessingStatus,
  DocumentMovement,
  DocumentSearchParams,
  DocumentType,
  DocumentTypeWithReferences,
  EmbeddedReferencePayload,
  FileProcessing,
  FileProcessingDetail,
  FileProcessingSearchParams,
  LoginPayload,
  LoginResponse,
  LogicalLocation,
  Notification,
  NotificationSearchParams,
  NotificationUnreadCount,
  PagedResult,
  PhysicalLocation,
  ReferencePayload,
  ReceiveDocumentMovementPayload,
  RecordDocumentMovementPayload,
  ReferenceRecord,
  Role,
  RolePayload,
  SetUserPasswordPayload,
  RolePermissionMatrix,
  SetDocumentReferencesPayload,
  UpdateLogicalLocationPayload,
  UpdatePhysicalLocationPayload,
  UpdateRolePermissionsPayload,
  UpdateFileProcessingStatusPayload,
  UpdateMyProfilePayload,
  UpdateBaseDocumentPayload,
  UpdateDocumentPayload,
  UpdateUserDocumentTypeAccessPayload,
  OrgStructureType,
  OrgStructureTypePayload,
  OrgStructureNode,
  CreateOrgStructurePayload,
  UpdateOrgStructurePayload,
  UpdateUserPayload,
  UpsertDocumentTypePayload,
  UserDocumentTypeAccess,
  User
} from '../types/api';

export const AUTH_STORAGE_KEY = 'earchive.auth';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const inflightGetRequests = new Map<string, Promise<unknown>>();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const sessionRaw = localStorage.getItem(AUTH_STORAGE_KEY);
  const session = sessionRaw ? (JSON.parse(sessionRaw) as LoginResponse) : null;
  const headers = new Headers(init?.headers);
  const method = (init?.method || 'GET').toUpperCase();
  const url = `${apiBaseUrl}${path}`;

  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const execute = async () => {
    const response = await fetch(url, {
      ...init,
      headers
    });

    const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    const errorMessage = body?.errors?.join(', ') || body?.message || response.statusText || 'Request failed.';

    if (response.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      throw new Error('Unauthorized. Please log in again.');
    }

    if (!response.ok || !body?.success) {
      throw new Error(errorMessage);
    }

    return body.data as T;
  };

  // Dedupe in-flight GET requests so StrictMode does not cause duplicate network calls.
  const canDedupe = method === 'GET' && !init?.body;
  const requestKey = `${method}:${url}:${session?.accessToken || ''}`;

  if (canDedupe) {
    const existing = inflightGetRequests.get(requestKey) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const inflight = execute()
      .finally(() => {
        inflightGetRequests.delete(requestKey);
      }) as Promise<T>;

    inflightGetRequests.set(requestKey, inflight);
    return inflight;
  }

  return execute();
}

export const api = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getUsers: (page = 1, pageSize = 20) =>
    request<PagedResult<User>>(`/api/users?page=${page}&pageSize=${pageSize}`),

  getMe: () => request<User>('/api/users/me'),

  getFileProcessings: ({ page, pageSize, query, status, sortBy, sortDescending }: FileProcessingSearchParams) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });

    if (query?.trim()) {
      params.set('query', query.trim());
    }

    if (typeof status === 'number') {
      params.set('status', String(status));
    }

    if (sortBy?.trim()) {
      params.set('sortBy', sortBy.trim());
    }

    if (typeof sortDescending === 'boolean') {
      params.set('sortDescending', String(sortDescending));
    }

    return request<PagedResult<FileProcessing>>(`/api/fileprocessings?${params.toString()}`);
  },

  getFileProcessingById: (id: string) =>
    request<FileProcessingDetail>(`/api/fileprocessings/${id}`),

  searchDocuments: ({
    page = 1,
    pageSize = 20,
    logicalLocationId,
    documentTypeId,
    status,
    title,
    physicalLocationId,
    createdFrom,
    createdTo
  }: DocumentSearchParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      logicalLocationId
    });

    if (documentTypeId?.trim()) params.set('documentTypeId', documentTypeId.trim());
    if (typeof status === 'number') params.set('status', String(status));
    if (title?.trim()) params.set('title', title.trim());
    if (physicalLocationId?.trim()) params.set('physicalLocationId', physicalLocationId.trim());
    if (createdFrom?.trim()) params.set('createdFrom', createdFrom.trim());
    if (createdTo?.trim()) params.set('createdTo', createdTo.trim());

    return request<PagedResult<Document>>(`/api/documents?${params.toString()}`);
  },

  advancedSearchDocuments: ({ page = 1, pageSize = 20, query, logicalLocationId }: AdvancedDocumentSearchParams) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      query: query.trim(),
      logicalLocationId
    });

    return request<PagedResult<AdvancedDocumentSearchResult>>(`/api/documents/advanced-search?${params.toString()}`);
  },

  getDocumentById: (id: string) => request<Document>(`/api/documents/${id}`),

  getDocumentDetail: (id: string) => request<DocumentDetail>(`/api/documents/${id}/detail`),

  getDocumentMovementsByDocument: (documentId: string) =>
    request<DocumentMovement[]>(`/api/documents/${documentId}/movements`),

  getPendingMovementReceipts: () =>
    request<DocumentMovement[]>('/api/documentmovements/pending-receipts'),

  recordDocumentMovement: (payload: RecordDocumentMovementPayload) =>
    request<DocumentMovement>('/api/documentmovements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  receiveDocumentMovement: (id: string, payload: ReceiveDocumentMovementPayload) =>
    request<DocumentMovement>(`/api/documentmovements/${id}/receive`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteDocumentMovement: (id: string) =>
    request<null>(`/api/documentmovements/${id}`, {
      method: 'DELETE'
    }),

  getOrgStructureTypes: () =>
    request<OrgStructureType[]>('/api/organizational-structure-types'),

  createOrgStructureType: (payload: OrgStructureTypePayload) =>
    request<OrgStructureType>('/api/organizational-structure-types', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateOrgStructureType: (id: number, payload: OrgStructureTypePayload) =>
    request<OrgStructureType>(`/api/organizational-structure-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteOrgStructureType: (id: number) =>
    request<null>(`/api/organizational-structure-types/${id}`, {
      method: 'DELETE'
    }),

  getOrgStructureTree: () =>
    request<OrgStructureNode[]>('/api/organizational-structures/tree'),

  getOrgStructureByType: (typeId: number) =>
    request<OrgStructureNode[]>(`/api/organizational-structures?typeId=${typeId}`),

  createOrgStructure: (payload: CreateOrgStructurePayload) =>
    request<OrgStructureNode>('/api/organizational-structures', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateOrgStructure: (id: number, payload: UpdateOrgStructurePayload) =>
    request<OrgStructureNode>(`/api/organizational-structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteOrgStructure: (id: number) =>
    request<null>(`/api/organizational-structures/${id}`, {
      method: 'DELETE'
    }),

  createDocument: (payload: CreateDocumentPayload) =>
    request<Document>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateDocument: (id: string, payload: UpdateDocumentPayload) =>
    request<Document>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteDocument: (id: string) =>
    request<null>(`/api/documents/${id}`, {
      method: 'DELETE'
    }),

  archiveDocument: (id: string, payload: ArchiveDocumentPayload) =>
    request<Document>(`/api/documents/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  setDocumentReferences: (id: string, payload: SetDocumentReferencesPayload) =>
    request<null>(`/api/documents/${id}/references`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  getDocumentFilesByDocument: (documentId: string) =>
    request<DocumentFile[]>(`/api/documents/${documentId}/files`),

  getDocumentFileById: (id: string) =>
    request<DocumentFile>(`/api/documentfiles/${id}`),

  uploadDocumentFile: (documentId: string, file: File, isOriginal = false) => {
    const formData = new FormData();
    formData.append('file', file);

    return request<DocumentFile>(`/api/documents/${documentId}/files?isOriginal=${String(isOriginal)}`, {
      method: 'POST',
      body: formData
    });
  },

  deleteDocumentFile: (id: string) =>
    request<null>(`/api/documentfiles/${id}`, {
      method: 'DELETE'
    }),

  queueDocumentFileOcr: (fileId: string) =>
    request<null>(`/api/documentfiles/${fileId}/queue-ocr`, {
      method: 'POST'
    }),

  getDocumentFileProcessingStatus: (fileId: string) =>
    request<DocumentFileProcessingStatus>(`/api/documentfiles/${fileId}/processing-status`),

  searchBaseDocuments: ({
    page = 1,
    pageSize = 20,
    documentNumber,
    description,
    dateFrom,
    dateTo
  }: BaseDocumentSearchParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });

    if (documentNumber?.trim()) params.set('documentNumber', documentNumber.trim());
    if (description?.trim()) params.set('description', description.trim());
    if (dateFrom?.trim()) params.set('dateFrom', dateFrom.trim());
    if (dateTo?.trim()) params.set('dateTo', dateTo.trim());

    return request<PagedResult<BaseDocument>>(`/api/basedocuments?${params.toString()}`);
  },

  getBaseDocumentById: (id: string) => request<BaseDocument>(`/api/basedocuments/${id}`),

  getBaseDocumentDetail: (id: string) =>
    request<BaseDocumentDetail>(`/api/basedocuments/${id}/detail`),

  uploadBaseDocumentFile: (baseDocumentId: string, file: File, isOriginal = false) => {
    const formData = new FormData();
    formData.append('file', file);

    return request<BaseDocumentDetail['files'][number]>(
      `/api/base-documents/${baseDocumentId}/files?isOriginal=${String(isOriginal)}`,
      {
        method: 'POST',
        body: formData
      }
    );
  },

  deleteBaseDocumentFile: (id: string) =>
    request<null>(`/api/basedocumentfiles/${id}`, {
      method: 'DELETE'
    }),

  createBaseDocument: (payload: CreateBaseDocumentPayload) =>
    request<BaseDocument>('/api/basedocuments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateBaseDocument: (id: string, payload: UpdateBaseDocumentPayload) =>
    request<BaseDocument>(`/api/basedocuments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteBaseDocument: (id: string) =>
    request<null>(`/api/basedocuments/${id}`, {
      method: 'DELETE'
    }),

  getMyNotifications: ({ page = 1, pageSize = 10, unreadOnly = false }: NotificationSearchParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      unreadOnly: String(unreadOnly)
    });

    return request<PagedResult<Notification>>(`/api/notifications?${params.toString()}`);
  },

  getUnreadNotificationsCount: () =>
    request<NotificationUnreadCount>('/api/notifications/unread-count'),

  markNotificationAsRead: (id: string) =>
    request<null>(`/api/notifications/${id}/read`, {
      method: 'PUT'
    }),

  markAllNotificationsAsRead: () =>
    request<null>('/api/notifications/read-all', {
      method: 'PUT'
    }),

  updateFileProcessingStatus: (id: string, payload: UpdateFileProcessingStatusPayload) =>
    request<null>(`/api/fileprocessings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  createUser: (payload: CreateUserPayload) =>
    request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateUser: (id: string, payload: UpdateUserPayload) =>
    request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  updateMyProfile: (payload: UpdateMyProfilePayload) =>
    request<User>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteUser: (id: string) =>
    request<null>(`/api/users/${id}`, {
      method: 'DELETE'
    }),

  lockUser: (id: string) =>
    request<null>(`/api/users/${id}/lock`, {
      method: 'POST'
    }),

  unlockUser: (id: string) =>
    request<null>(`/api/users/${id}/unlock`, {
      method: 'POST'
    }),

  assignRoles: (id: string, payload: AssignRolesPayload) =>
    request<null>(`/api/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  getUserDocumentTypeAccess: (id: string) =>
    request<UserDocumentTypeAccess>(`/api/users/${id}/document-type-access`),

  updateUserDocumentTypeAccess: (id: string, payload: UpdateUserDocumentTypeAccessPayload) =>
    request<UserDocumentTypeAccess>(`/api/users/${id}/document-type-access`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  changeOwnPassword: (payload: ChangeOwnPasswordPayload) =>
    request<null>('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  setUserPassword: (id: string, payload: SetUserPasswordPayload) =>
    request<null>(`/api/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  getRoles: () => request<Role[]>('/api/roles'),

  createRole: (payload: RolePayload) =>
    request<Role>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateRole: (id: string, payload: RolePayload) =>
    request<Role>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteRole: (id: string) =>
    request<null>(`/api/roles/${id}`, {
      method: 'DELETE'
    }),

  getRoleMatrix: (roleId: string) => request<RolePermissionMatrix>(`/api/permissions/roles/${roleId}`),

  updateRolePermissions: (roleId: string, payload: UpdateRolePermissionsPayload) =>
    request<null>(`/api/permissions/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  getDocumentTypes: () => request<DocumentType[]>('/api/documenttypes'),

  getDocumentTypeWithReferences: (id: string) =>
    request<DocumentTypeWithReferences>(`/api/documenttypes/${id}/with-references`),

  createDocumentType: (payload: UpsertDocumentTypePayload) =>
    request<DocumentTypeWithReferences>('/api/documenttypes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateDocumentType: (id: string, payload: UpsertDocumentTypePayload) =>
    request<DocumentTypeWithReferences>(`/api/documenttypes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  syncDocumentTypeReferences: (id: string, references: EmbeddedReferencePayload[]) =>
    request<DocumentTypeWithReferences>(`/api/documenttypes/${id}/references`, {
      method: 'PATCH',
      body: JSON.stringify(references)
    }),

  deleteDocumentType: (id: string) =>
    request<null>(`/api/documenttypes/${id}`, {
      method: 'DELETE'
    }),

  getReferencesByDocumentType: (documentTypeId: string) =>
    request<ReferenceRecord[]>(`/api/references/by-document-type/${documentTypeId}`),

  createReference: (payload: ReferencePayload) =>
    request<ReferenceRecord>('/api/references', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateReference: (id: string, payload: Omit<ReferencePayload, 'documentTypeId'>) =>
    request<ReferenceRecord>(`/api/references/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteReference: (id: string) =>
    request<null>(`/api/references/${id}`, {
      method: 'DELETE'
    }),

  getLogicalLocationHierarchy: () =>
    request<LogicalLocation[]>('/api/logical-locations/hierarchy'),

  getMyBuildings: () =>
    request<LogicalLocation[]>('/api/logical-locations/my-buildings'),

  getLogicalLocationById: (id: string) =>
    request<LogicalLocation>(`/api/logical-locations/${id}`),

  createLogicalLocation: (payload: CreateLogicalLocationPayload) =>
    request<LogicalLocation>('/api/logical-locations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLogicalLocation: (id: string, payload: UpdateLogicalLocationPayload) =>
    request<LogicalLocation>(`/api/logical-locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteLogicalLocation: (id: string) =>
    request<null>(`/api/logical-locations/${id}`, {
      method: 'DELETE'
    }),

  getPhysicalLocations: () =>
    request<PhysicalLocation[]>('/api/physical-locations'),

  getPhysicalLocationById: (id: string) =>
    request<PhysicalLocation>(`/api/physical-locations/${id}`),

  createPhysicalLocation: (payload: CreatePhysicalLocationPayload) =>
    request<PhysicalLocation>('/api/physical-locations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updatePhysicalLocation: (id: string, payload: UpdatePhysicalLocationPayload) =>
    request<PhysicalLocation>(`/api/physical-locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deletePhysicalLocation: (id: string) =>
    request<null>(`/api/physical-locations/${id}`, {
      method: 'DELETE'
    }),

  generatePhysicalLocationQrCode: (id: string) =>
    request<PhysicalLocation>(`/api/physical-locations/${id}/generate-qr`, {
      method: 'POST'
    }),

  downloadBaseDocumentFile: async (id: string): Promise<{ blob: Blob; fileName: string }> => {
    const sessionRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    const session = sessionRaw ? (JSON.parse(sessionRaw) as LoginResponse) : null;
    const response = await fetch(`${apiBaseUrl}/api/basedocumentfiles/${id}/download`, {
      headers: {
        Authorization: session?.accessToken ? `Bearer ${session.accessToken}` : ''
      }
    });
    if (!response.ok) throw new Error('Fayl yükləmə zamanı xəta baş verdi.');
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match ? match[1].replace(/['"]/g, '') : id;
    return { blob, fileName };
  },

  downloadDocumentFile: async (id: string): Promise<{ blob: Blob; fileName: string }> => {
    const sessionRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    const session = sessionRaw ? (JSON.parse(sessionRaw) as LoginResponse) : null;
    const response = await fetch(`${apiBaseUrl}/api/documentfiles/${id}/download`, {
      headers: {
        Authorization: session?.accessToken ? `Bearer ${session.accessToken}` : ''
      }
    });
    if (!response.ok) throw new Error('Fayl yükləmə zamanı xəta baş verdi.');
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match ? match[1].replace(/['"]/g, '') : id;
    return { blob, fileName };
  }
};