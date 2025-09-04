// Admin Management Interfaces
// These interfaces define the data structures for admin management operations

export interface Admin {
  AdminID: number;
  FirstName: string;
  LastName: string;
  MiddleInitial?: string;
  Suffix?: string;
  FullName: string;
  Email: string;
  Role: AdminRole;
  Status: AdminStatus;
  ProfilePhoto?: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface AdminUser {
  adminId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  phoneNumber?: string;
  profilePhoto?: string;
}

export interface CreateAdminRequest {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  suffix?: string;
  email: string;
  password: string;
  role: AdminRole;
  status?: AdminStatus;
}

export interface UpdateAdminRequest {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  suffix?: string;
  email?: string;
  password?: string;
  role?: AdminRole;
  status?: AdminStatus;
}

export interface AdminListItem {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  lastLogin?: string;
  status: string;
  profilePhoto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  superAdmins: number;
  librarians: number;
  librarianStaff: number;
  dataCenterAdmins: number;
}

export interface AdminAuditLog {
  LogID: number;
  AdminID: number;
  AdminName: string;
  AdminRole: string;
  Action: string;
  AffectedTable?: string;
  AffectedID?: number;
  Timestamp: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AdminPermission {
  action: string;
  resource: string;
  allowed: boolean;
}

export interface AdminSession {
  adminId: number;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  lastActivity: string;
}

// Enums for type safety
export type AdminRole = 'Super Admin' | 'Data Center Admin' | 'Librarian' | 'Librarian Staff';
export type AdminStatus = 'Active' | 'Inactive';

// API Response interfaces
export interface AdminApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  error?: string;
}

export interface GetAllAdminsResponse extends AdminApiResponse<Admin[]> {
  count: number;
}

export interface GetAdminResponse extends AdminApiResponse<Admin> {}

export interface CreateAdminResponse extends AdminApiResponse<{
  adminID: number;
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}> {}

export interface UpdateAdminResponse extends AdminApiResponse<{
  adminID: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}> {}

export interface DeleteAdminResponse extends AdminApiResponse<{
  adminID: string;
  message: string;
}> {}

export interface AdminAuditLogsResponse extends AdminApiResponse<AdminAuditLog[]> {
  count: number;
}

// Form interfaces for UI components
export interface AdminFormData {
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: AdminRole;
  status: AdminStatus;
}

export interface AdminEditFormData {
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
}

// Component state interfaces
export interface AdminManagementState {
  admins: AdminListItem[];
  loading: boolean;
  error: string | null;
  selectedAdmin: AdminListItem | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showPermissionsModal: boolean;
  stats: AdminStats;
}

export interface AdminTableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

export interface AdminTableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface AdminTableFilter {
  role?: AdminRole;
  status?: AdminStatus;
  search?: string;
}

// Utility interfaces
export interface AdminRoleInfo {
  role: AdminRole;
  level: number;
  permissions: string[];
  description: string;
}

export interface AdminDepartment {
  id: string;
  name: string;
  description: string;
}

// Constants for admin roles and their hierarchy
export const ADMIN_ROLE_HIERARCHY: Record<AdminRole, number> = {
  'Librarian Staff': 1,
  'Librarian': 2,
  'Data Center Admin': 3,
  'Super Admin': 4
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  'Super Admin': 'Full system access with all administrative privileges',
  'Data Center Admin': 'System administration and data management privileges',
  'Librarian': 'Library management and user administration privileges',
  'Librarian Staff': 'Basic library operations and limited administrative access'
};

// Default values
export const DEFAULT_ADMIN_STATUS: AdminStatus = 'Active';
export const DEFAULT_ADMIN_ROLE: AdminRole = 'Librarian';
