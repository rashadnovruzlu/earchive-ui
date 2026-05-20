export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors: string[];
};

export type DashboardStats = {
  totalDocuments: number;
  insertedDocumentsToday: number;
  indexedFileCount: number;
  pendingMovementDocumentCount: number;
  totalUsers: number;
  pendingFileProcessingCount: number;
  failedFileProcessingCount: number;
  unreadNotificationCount: number;
  archivedDocuments: number;
  activeDisposalCycleCount: number;
  totalDocumentTypes: number;
  totalLogicalLocations: number;
  totalPhysicalLocations: number;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type FileProcessingStatusName = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Indexed';

export type FileProcessing = {
  id: string;
  documentFileId: string;
  documentId: string;
  baseDocumentId?: string | null;
  baseDocumentNumber?: string | null;
  documentTitle: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isOriginal: boolean;
  status: FileProcessingStatusName;
  errorMessage?: string | null;
  processedDate?: string | null;
  createdDate: string;
  updatedDate?: string | null;
};

export type FileProcessingDetail = FileProcessing & {
  ocrExtractedText?: string | null;
};

export type FileProcessingSearchParams = {
  page: number;
  pageSize: number;
  query?: string;
  status?: number;
  sortBy?: string;
  sortDescending?: boolean;
};

export type UpdateFileProcessingStatusPayload = {
  status: number;
};

export type BaseDocumentFile = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isOriginal: boolean;
  uploadedDate: string;
};

export type BaseDocument = {
  id: string;
  documentNumber: string;
  documentDate: string;
  description?: string | null;
  fileCount: number;
  documentCount: number;
  createdDate: string;
};

export type BaseDocumentDetail = BaseDocument & {
  files: BaseDocumentFile[];
};

export type BaseDocumentSearchParams = {
  page?: number;
  pageSize?: number;
  documentNumber?: string;
  description?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type CreateBaseDocumentPayload = {
  documentNumber: string;
  documentDate: string;
  description?: string | null;
};

export type UpdateBaseDocumentPayload = {
  documentNumber: string;
  documentDate: string;
  description?: string | null;
};

export type DocumentStatusName = 'Pending' | 'Archived';

export type DocumentTag = {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
  documentCount: number;
};

export type DocumentReference = {
  referenceId: string;
  referenceName: string;
  value: string;
  columnType: string;
  validationRegex?: string | null;
};

export type SetReferenceValuePayload = {
  referenceId: string;
  value: string;
};

export type SetDocumentReferencesPayload = {
  references: SetReferenceValuePayload[];
};

export type DocumentFile = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isOriginal: boolean;
  uploadedDate: string;
};

export type Document = {
  id: string;
  documentNumber: string;
  baseDocumentId?: string | null;
  baseDocumentNumber?: string | null;
  title: string;
  status: DocumentStatusName;
  documentTypeId: string;
  documentTypeName: string;
  physicalLocationId?: string | null;
  physicalLocationName?: string | null;
  logicalLocationId?: string | null;
  logicalLocationName?: string | null;
  expirationDate?: string | null;
  archivedDate?: string | null;
  createdDate: string;
  fileCount: number;
  qrCodeKey?: string | null;
  tags: DocumentTag[];
};

export type DocumentDetail = Document & {
  references: DocumentReference[];
  files: DocumentFile[];
};

export type AdvancedDocumentSearchResult = {
  documentId: string;
  baseDocumentId?: string | null;
  baseDocumentNumber?: string | null;
  title: string;
  fileIds: string[];
  fileNames: string[];
  highlights: string[];
  fileHighlights?: AdvancedDocumentFileHighlight[];
  score: number;
};

export type AdvancedDocumentFileHighlight = {
  fileId: string;
  fileName: string;
  highlights: string[];
};

export type DocumentSearchParams = {
  page?: number;
  pageSize?: number;
  logicalLocationId: string;
  documentTypeId?: string;
  status?: number;
  title?: string;
  physicalLocationId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type AdvancedDocumentSearchParams = {
  page?: number;
  pageSize?: number;
  query: string;
  logicalLocationId: string;
};

export type CreateDocumentPayload = {
  baseDocumentId?: string | null;
  documentTypeId: string;
  title: string;
  physicalLocationId?: string | null;
  expirationDate?: string | null;
  references: SetReferenceValuePayload[];
};

export type UpdateDocumentPayload = {
  baseDocumentId?: string | null;
  title: string;
  physicalLocationId?: string | null;
  expirationDate?: string | null;
  references: SetReferenceValuePayload[];
};

export type ArchiveDocumentPayload = {
  physicalLocationId?: string | null;
};

export type DocumentMovement = {
  id: string;
  documentId: string;
  documentTitle: string;
  fromLocationName?: string | null;
  toLocationName: string;
  organizationalStructureId?: number | null;
  movedByUsername: string;
  receivedByUsername?: string | null;
  isReceived: boolean;
  givingDate: string;
  receivingDate?: string | null;
  notes?: string | null;
};

export type RecordDocumentMovementPayload = {
  documentId: string;
  organizationalStructureId: number;
  notes?: string;
};

export type ReceiveDocumentMovementPayload = {
  toPhysicalLocationId: string;
  notes?: string;
};

export type DocumentFileProcessingStatus = {
  id: string;
  documentFileId: string;
  status: string;
  ocrExtractedText?: string | null;
  errorMessage?: string | null;
  processedDate?: string | null;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string | null;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  createdAt: string;
};

export type NotificationSearchParams = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
};

export type NotificationUnreadCount = {
  count: number;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  username: string;
  roles: string[];
};

export type RoleSummary = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  username: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isLocked: boolean;
  organizationalStructureId?: number | null;
  organizationalStructureName?: string | null;
  createdDate: string;
  lastLoginDate?: string | null;
  roles: RoleSummary[];
};

export type CreateUserPayload = {
  username: string;
  password: string;
  pin: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  organizationalStructureId?: number | null;
  roleIds: string[];
};

export type UpdateUserPayload = {
  username: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  organizationalStructureId?: number | null;
};

export type UpdateMyProfilePayload = {
  username: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

export type AssignRolesPayload = {
  roleIds: string[];
};

export type UserDocumentTypeAccess = {
  userId: string;
  hasAllAccess: boolean;
  documentTypeIds: string[];
};

export type UpdateUserDocumentTypeAccessPayload = {
  hasAllAccess: boolean;
  documentTypeIds: string[];
};

export type ChangeOwnPasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type SetUserPasswordPayload = {
  newPassword: string;
  confirmNewPassword: string;
};

export type ControllerAction = {
  id: string;
  controllerName: string;
  actionName: string;
  httpMethod: string;
  route: string;
  description?: string | null;
};

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  actions: ControllerAction[];
};

export type RolePayload = {
  name: string;
  description?: string;
};

export type PermissionActionMatrix = {
  actionId: string;
  actionName: string;
  httpMethod: string;
  route: string;
  description?: string | null;
  isAssigned: boolean;
};

export type PermissionControllerMatrix = {
  controllerId: string;
  controllerName: string;
  description?: string | null;
  actions: PermissionActionMatrix[];
};

export type RolePermissionMatrix = {
  roleId: string;
  roleName: string;
  controllers: PermissionControllerMatrix[];
};

export type UpdateRolePermissionsPayload = {
  grantActionIds: string[];
  revokeActionIds: string[];
};

export type DocumentType = {
  id: string;
  name: string;
  description?: string | null;
  index: number;
  counter: number;
  retentionMonth: number;
};

export type DocumentTypePayload = {
  name: string;
  description?: string;
  index: number;
  counter: number;
  retentionMonth: number;
};

export type EmbeddedReferenceOptionPayload = {
  value: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
};

export type EmbeddedReferencePayload = {
  id?: string;
  name: string;
  validationRegex?: string;
  columnType: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  helpText?: string;
  options: EmbeddedReferenceOptionPayload[];
};

export type UpsertDocumentTypePayload = {
  name: string;
  description?: string;
  index: number;
  counter: number;
  retentionMonth: number;
  references: EmbeddedReferencePayload[];
};

export type DocumentTypeWithReferences = DocumentType & {
  references: ReferenceRecord[];
};

export type ReferenceOption = {
  id?: string;
  value: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
};

export type ReferenceRecord = {
  id: string;
  documentTypeId: string;
  name: string;
  validationRegex?: string | null;
  columnType: string;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string | null;
  helpText?: string | null;
  options: ReferenceOption[];
};

export type ReferencePayload = {
  documentTypeId: string;
  name: string;
  validationRegex?: string;
  columnType: number;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  helpText?: string;
  options: ReferenceOption[];
};

export const columnTypeOptions = [
  { value: 0, label: 'Text' },
  { value: 1, label: 'Number' },
  { value: 2, label: 'Date' },
  { value: 3, label: 'Boolean' },
  { value: 4, label: 'Decimal' },
  { value: 5, label: 'DateTime' },
  { value: 6, label: 'Dropdown' }
] as const;

export const columnTypeValueByName: Record<string, number> = {
  Text: 0,
  Number: 1,
  Date: 2,
  Boolean: 3,
  Decimal: 4,
  DateTime: 5,
  Dropdown: 6
};

export type LocationLevel = 'Building' | 'Floor' | 'Room' | 'Shelf' | 'Box';

export const locationLevelOptions = [
  { value: 1, name: 'Building' as LocationLevel, label: 'Bina' },
  { value: 2, name: 'Floor' as LocationLevel, label: 'Mərtəbə' },
  { value: 3, name: 'Room' as LocationLevel, label: 'Otaq' },
  { value: 4, name: 'Shelf' as LocationLevel, label: 'Rəf' },
  { value: 5, name: 'Box' as LocationLevel, label: 'Qutu' }
] as const;

export type LogicalLocation = {
  id: string;
  name: string;
  level: LocationLevel;
  parentId?: string | null;
  organizationalStructureId?: number | null;
  children: LogicalLocation[];
};

export type PhysicalLocation = {
  id: string;
  name: string;
  logicalLocationId: string;
  logicalLocationName: string;
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
};

export type CreateLogicalLocationPayload = {
  name: string;
  level: number;
  parentId?: string | null;
  organizationalStructureId?: number | null;
};

export type UpdateLogicalLocationPayload = {
  name: string;
  level: number;
  parentId?: string | null;
  organizationalStructureId?: number | null;
};

export type CreatePhysicalLocationPayload = {
  name: string;
  logicalLocationId: string;
  totalSpace: number;
};

export type UpdatePhysicalLocationPayload = {
  name: string;
  logicalLocationId: string;
  totalSpace: number;
  usedSpace: number;
};

export type OrgStructureType = {
  id: number;
  name: string;
};

export type OrgStructureTypePayload = {
  name: string;
};

export type OrgStructureNode = {
  id: number;
  organizationalStructureTypeId: number;
  typeName: string;
  parentId?: number | null;
  parentName?: string | null;
  name: string;
  children: OrgStructureNode[];
};

export type CreateOrgStructurePayload = {
  organizationalStructureTypeId: number;
  parentId?: number | null;
  name: string;
};

export type UpdateOrgStructurePayload = {
  organizationalStructureTypeId: number;
  parentId?: number | null;
  name: string;
};