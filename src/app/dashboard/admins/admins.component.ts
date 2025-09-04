import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import {
  Admin,
  AdminListItem,
  AdminStats,
  AdminRole,
  AdminStatus,
  CreateAdminRequest,
  UpdateAdminRequest,
  AdminFormData,
  AdminEditFormData,
  ADMIN_ROLE_HIERARCHY
} from '../../shared/interfaces/admin.interfaces';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements OnInit, OnDestroy {
  // Component state
  admins: AdminListItem[] = [];
  allAdmins: AdminListItem[] = []; // Keep for compatibility with existing methods
  loading: boolean = false;
  isSubmitting: boolean = false;
  error: string | null = null;
  selectedAdmin: AdminListItem | null = null;

  // Pagination properties (following books component pattern)
  currentPage: number = 1;
  itemsPerPage: number = 10; // Same default as books component
  totalPages: number = 0;
  totalAdmins: number = 0;

  // Modal states
  showCreateModal: boolean = false;
  showEditAdminModal: boolean = false;
  showViewAdminModal: boolean = false;
  showBlockAdminModal: boolean = false;
  showDeleteAdminModal: boolean = false;
  showAdminSummaryModal: boolean = false;

  // Form error states
  createFormError: string | null = null;

  // Form data
  createForm: AdminFormData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Librarian',
    status: 'Active'
  };

  editForm: AdminEditFormData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    email: '',
    role: 'Librarian',
    status: 'Active'
  };

  // Edit admin data structure
  editAdminData: any = {
    adminId: '',
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    email: '',
    role: 'Librarian',
    status: 'Active'
  };

  // Statistics
  stats: AdminStats = {
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    superAdmins: 0,
    librarians: 0,
    librarianStaff: 0,
    dataCenterAdmins: 0
  };

  // Filtering and sorting
  searchTerm: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Available options
  availableRoles: AdminRole[] = ['Super Admin', 'Data Center Admin', 'Librarian', 'Librarian Staff'];
  availableStatuses: AdminStatus[] = ['Active', 'Inactive'];

  private subscriptions: Subscription[] = [];

  constructor(
    private themeService: ThemeService,
    private apiService: ApiService,
    private toastService: ToastService
  ) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    console.log('🎯 AdminsComponent initialized - loading admin data...');
    console.log('🔧 Current admins array:', this.admins);
    console.log('🔧 Current stats:', this.stats);
    this.loadAdmins();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Data loading methods
  loadAdmins(): void {
    // Only load from server once, then use client-side pagination
    if (this.allAdmins.length === 0) {
      this.loadAllAdminsFromServer();
    } else {
      this.updateDisplayedAdmins();
    }
  }

  private loadAllAdminsFromServer(): void {
    this.loading = true;
    this.error = null;

    console.log('📊 Loading all admins from database...');

    // Load all admins without pagination parameters since server pagination isn't working
    const subscription = this.apiService.getAllAdmins().subscribe({
      next: (response: any) => {
        console.log('✅ Admins loaded successfully:', response);
        console.log('🔧 Response data:', response.data);
        console.log('🔧 Response count:', response.count);

        if (response.success && response.data) {
          console.log('🔧 Mapping admins to list items...');
          this.allAdmins = this.mapAdminsToListItems(response.data);
          console.log('🔧 All admins loaded:', this.allAdmins.length);

          // Calculate pagination info based on all data
          this.totalAdmins = this.allAdmins.length;
          this.totalPages = Math.ceil(this.totalAdmins / this.itemsPerPage);

          // Use stats from server if available, otherwise calculate from all data
          if (response.stats) {
            this.stats = response.stats;
          } else {
            this.calculateStatsFromAllData();
          }

          // Update displayed admins for current page
          this.updateDisplayedAdmins();

          console.log('📊 Client-side Pagination Info:', {
            totalAdmins: this.totalAdmins,
            itemsPerPage: this.itemsPerPage,
            totalPages: this.totalPages,
            currentPage: this.currentPage
          });
        } else {
          console.log('❌ API response indicates failure:', response);
          this.error = response.error || 'Failed to load admins';
          this.toastService.error(this.error || 'Failed to load admins');
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading admins:', error);
        this.error = error.error || 'Failed to load admins';
        this.loading = false;
        this.toastService.error(this.error || 'Failed to load admins');
      }
    });

    this.subscriptions.push(subscription);
  }

  private updateDisplayedAdmins(): void {
    // Apply client-side pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    // Apply filters first, then paginate
    let filteredData = this.applyClientSideFilters(this.allAdmins);
    
    // Update total count based on filtered data
    this.totalAdmins = filteredData.length;
    this.totalPages = Math.ceil(this.totalAdmins / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    // Get the page slice
    this.admins = filteredData.slice(startIndex, endIndex);
    
    console.log(`📄 Client-side pagination: Showing ${this.admins.length} admins (${startIndex + 1}-${Math.min(endIndex, this.totalAdmins)} of ${this.totalAdmins})`);
  }

  private applyClientSideFilters(data: AdminListItem[]): AdminListItem[] {
    let filtered = [...data];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(admin =>
        admin.name.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search)
      );
    }

    // Apply role filter
    if (this.selectedRole) {
      filtered = filtered.filter(admin => admin.role === this.selectedRole);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(admin => admin.status === this.selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = ADMIN_ROLE_HIERARCHY[a.role as AdminRole] || 0;
          bValue = ADMIN_ROLE_HIERARCHY[b.role as AdminRole] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  private calculateStatsFromAllData(): void {
    // Calculate stats from all admins data
    this.stats = {
      totalAdmins: this.allAdmins.length,
      activeAdmins: this.allAdmins.filter(a => a.status === 'Active').length,
      inactiveAdmins: this.allAdmins.filter(a => a.status === 'Inactive').length,
      superAdmins: this.allAdmins.filter(a => a.role === 'Super Admin').length,
      librarians: this.allAdmins.filter(a => a.role === 'Librarian').length,
      librarianStaff: this.allAdmins.filter(a => a.role === 'Librarian Staff').length,
      dataCenterAdmins: this.allAdmins.filter(a => a.role === 'Data Center Admin').length
    };
  }

  // Data transformation methods
  private mapAdminsToListItems(admins: Admin[]): AdminListItem[] {
    return admins.map(admin => ({
      id: admin.AdminID,
      name: admin.FullName,
      email: admin.Email,
      role: admin.Role,
      status: admin.Status,
      profilePhoto: admin.ProfilePhoto,
      createdAt: admin.CreatedAt,
      updatedAt: admin.UpdatedAt
    }));
  }

  private calculateStats(): void {
    // For paginated data, we should only calculate stats from current page
    // or get stats from a separate API call. For now, we'll use current page data
    // but keep totalAdmins from server response
    this.stats = {
      totalAdmins: this.totalAdmins, // Use server-provided total
      activeAdmins: this.admins.filter(a => a.status === 'Active').length,
      inactiveAdmins: this.admins.filter(a => a.status === 'Inactive').length,
      superAdmins: this.admins.filter(a => a.role === 'Super Admin').length,
      librarians: this.admins.filter(a => a.role === 'Librarian').length,
      librarianStaff: this.admins.filter(a => a.role === 'Librarian Staff').length,
      dataCenterAdmins: this.admins.filter(a => a.role === 'Data Center Admin').length
    };
  }

  // Modal control methods
  openCreateModal(): void {
    this.resetCreateForm();
    this.createFormError = null;
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetCreateForm();
    this.createFormError = null;
  }

  openEditAdminModal(admin: AdminListItem): void {
    this.selectedAdmin = admin;
    this.populateEditAdmin(admin);
    this.showEditAdminModal = true;
  }

  closeEditAdminModal(): void {
    this.showEditAdminModal = false;
    this.selectedAdmin = null;
    this.resetEditAdmin();
  }

  openViewAdminModal(admin: AdminListItem): void {
    this.selectedAdmin = admin;
    this.showViewAdminModal = true;
  }

  closeViewAdminModal(): void {
    this.showViewAdminModal = false;
    this.selectedAdmin = null;
  }

  openBlockAdminModal(admin: AdminListItem): void {
    this.selectedAdmin = admin;
    this.showBlockAdminModal = true;
  }

  closeBlockAdminModal(): void {
    this.showBlockAdminModal = false;
    this.selectedAdmin = null;
  }

  openDeleteFromView(): void {
    // Close view modal without clearing selectedAdmin
    this.showViewAdminModal = false;
    this.showDeleteAdminModal = true;
  }

  closeDeleteAdminModal(): void {
    this.showDeleteAdminModal = false;
    this.selectedAdmin = null;
  }

  // CRUD operations
  createAdmin(): void {
    // Clear previous errors
    this.createFormError = null;

    if (!this.validateCreateForm()) {
      return;
    }

    this.loading = true;

    const adminData: CreateAdminRequest = {
      firstName: this.createForm.firstName.trim(),
      lastName: this.createForm.lastName.trim(),
      middleInitial: this.createForm.middleInitial.trim() || undefined,
      suffix: this.createForm.suffix.trim() || undefined,
      email: this.createForm.email.trim().toLowerCase(),
      password: this.createForm.password,
      role: this.createForm.role,
      status: this.createForm.status
    };

    console.log('➕ Creating new admin:', adminData);

    const subscription = this.apiService.createAdmin(adminData).subscribe({
      next: (response) => {
        console.log('✅ Admin created successfully:', response);

        if (response.success) {
          this.toastService.success(`Admin ${adminData.firstName} ${adminData.lastName} created successfully!`);
          this.closeCreateModal();
          this.refreshAdmins(); // Reload all data from server
        } else {
          // Handle specific error messages
          const errorMessage = response.error || response.message || 'Failed to create admin';
          this.createFormError = this.getFormattedErrorMessage(errorMessage);
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            this.createFormError = null;
          }, 5000);
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error creating admin:', error);
        this.loading = false;
        
        // Handle different types of errors
        let errorMessage = 'Failed to create admin. Please try again.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.createFormError = this.getFormattedErrorMessage(errorMessage);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          this.createFormError = null;
        }, 5000);
      }
    });

    this.subscriptions.push(subscription);
  }

  updateAdmin(): void {
    if (!this.selectedAdmin || !this.validateEditAdmin()) {
      return;
    }

    this.isSubmitting = true;

    const adminData = {
      firstName: this.editAdminData.firstName.trim(),
      lastName: this.editAdminData.lastName.trim(),
      middleInitial: this.editAdminData.middleInitial.trim() || undefined,
      suffix: this.editAdminData.suffix.trim() || undefined,
      email: this.editAdminData.email.trim(),
      role: this.editAdminData.role,
      status: this.editAdminData.status
    };

    console.log('✏️ Updating admin:', this.selectedAdmin.id, adminData);

    const subscription = this.apiService.updateAdmin(this.selectedAdmin.id.toString(), adminData).subscribe({
      next: (response) => {
        console.log('✅ Admin updated successfully:', response);

        if (response.success) {
          this.toastService.clear();
          this.toastService.success(`Admin ${this.editAdminData.firstName} ${this.editAdminData.lastName} updated successfully!`, undefined, 3000);
          this.closeEditAdminModal();
          setTimeout(() => {
            this.refreshAdmins(); // Reload all data from server
          }, 500);
        } else {
          this.toastService.clear();
          this.toastService.error(response.error || 'Failed to update admin');
        }

        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error updating admin:', error);
        this.toastService.clear();
        this.toastService.error(error.error || 'Failed to update admin');
        this.isSubmitting = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  deleteAdmin(): void {
    console.log('🔥 DELETE BUTTON CLICKED!'); // Debug log
    console.log('🔧 Selected admin:', this.selectedAdmin);
    console.log('🔧 Is submitting:', this.isSubmitting);

    if (!this.selectedAdmin) {
      console.log('❌ No admin selected for deletion');
      this.toastService.error('No admin selected for deletion');
      return;
    }

    if (this.isSubmitting) {
      console.log('❌ Already processing, please wait...');
      return;
    }

    this.isSubmitting = true;
    const adminName = this.selectedAdmin.name;
    const adminId = this.selectedAdmin.id;

    console.log('🗑️ Deleting admin:', adminId, adminName);
    console.log('🔧 API Service:', this.apiService);

    // Check if API service has deleteAdmin method
    if (!this.apiService.deleteAdmin) {
      console.error('❌ deleteAdmin method not found in API service');
      this.toastService.error('Delete functionality not available');
      this.isSubmitting = false;
      return;
    }

    const subscription = this.apiService.deleteAdmin(adminId.toString()).subscribe({
      next: (response: any) => {
        console.log('✅ Delete response:', response);
        if (response && response.success) {
          this.toastService.clear();
          this.toastService.success(`Admin ${adminName} deleted successfully!`, undefined, 3000);
          this.closeDeleteAdminModal();
          // Add small delay before refreshing to prevent rapid API calls
          setTimeout(() => {
            this.refreshAdmins(); // Reload all data from server
          }, 500);
        } else {
          console.log('❌ Delete failed:', response);
          this.toastService.clear();
          this.toastService.error(response?.message || response?.error || 'Failed to delete admin. Please try again.');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Delete API error:', error);
        this.isSubmitting = false;
        this.toastService.clear();
        
        let errorMessage = 'Failed to delete admin. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.toastService.error(errorMessage);
      }
    });

    this.subscriptions.push(subscription);
  }

  // Form management methods
  private resetCreateForm(): void {
    this.createForm = {
      firstName: '',
      lastName: '',
      middleInitial: '',
      suffix: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Librarian',
      status: 'Active'
    };
  }

  private resetEditForm(): void {
    this.editForm = {
      firstName: '',
      lastName: '',
      middleInitial: '',
      suffix: '',
      email: '',
      role: 'Librarian',
      status: 'Active'
    };
  }

  private populateEditAdmin(admin: AdminListItem): void {
    // Parse the full name to get individual components
    const nameParts = admin.name.split(' ');

    this.editAdminData = {
      adminId: admin.id,
      firstName: nameParts[0] || '',
      lastName: nameParts[nameParts.length - 1] || '',
      middleInitial: nameParts.length > 2 ? nameParts[1] : '',
      suffix: '',
      email: admin.email,
      role: admin.role,
      status: admin.status
    };
  }

  private resetEditAdmin(): void {
    this.editAdminData = {
      adminId: '',
      firstName: '',
      lastName: '',
      middleInitial: '',
      suffix: '',
      email: '',
      role: 'Librarian',
      status: 'Active'
    };
  }

  // Helper method to set form error with auto-dismiss
  private setCreateFormError(message: string): void {
    this.createFormError = message;
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.createFormError = null;
    }, 5000);
  }

  // Validation methods
  private validateCreateForm(): boolean {
    if (!this.createForm.firstName.trim()) {
      this.setCreateFormError('First name is required');
      return false;
    }

    if (!this.createForm.lastName.trim()) {
      this.setCreateFormError('Last name is required');
      return false;
    }

    if (!this.createForm.email.trim()) {
      this.setCreateFormError('Email address is required');
      return false;
    }

    if (!this.isValidEmail(this.createForm.email)) {
      this.setCreateFormError('Please enter a valid email address');
      return false;
    }

    // Check if email already exists in current admin list
    const emailExists = this.allAdmins.some(admin => 
      admin.email.toLowerCase() === this.createForm.email.trim().toLowerCase()
    );
    if (emailExists) {
      this.setCreateFormError('An admin with this email address already exists');
      return false;
    }

    if (!this.createForm.password) {
      this.setCreateFormError('Password is required');
      return false;
    }

    if (this.createForm.password.length < 6) {
      this.setCreateFormError('Password must be at least 6 characters long');
      return false;
    }

    if (this.createForm.password !== this.createForm.confirmPassword) {
      this.setCreateFormError('Passwords do not match');
      return false;
    }

    // Validate middle initial if provided
    if (this.createForm.middleInitial && this.createForm.middleInitial.length > 1) {
      this.setCreateFormError('Middle initial should be only one character');
      return false;
    }

    return true;
  }

  private getFormattedErrorMessage(errorMessage: string): string {
    // Format common error messages to be more user-friendly
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('duplicate') || lowerError.includes('already exists') || lowerError.includes('unique')) {
      return 'An admin with this email address already exists. Please use a different email.';
    }
    
    if (lowerError.includes('email') && lowerError.includes('invalid')) {
      return 'Please enter a valid email address.';
    }
    
    if (lowerError.includes('password')) {
      return 'Password does not meet requirements. Please ensure it is at least 6 characters long.';
    }
    
    if (lowerError.includes('required') || lowerError.includes('missing')) {
      return 'Please fill in all required fields.';
    }
    
    // Return the original message if no specific formatting is needed
    return errorMessage;
  }

  private validateEditAdmin(): boolean {
    if (!this.editAdminData.firstName.trim()) {
      this.toastService.error('First name is required');
      return false;
    }

    if (!this.editAdminData.lastName.trim()) {
      this.toastService.error('Last name is required');
      return false;
    }

    if (!this.editAdminData.email.trim()) {
      this.toastService.error('Email is required');
      return false;
    }

    if (!this.isValidEmail(this.editAdminData.email)) {
      this.toastService.error('Please enter a valid email address');
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility methods
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'Super Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Data Center Admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Librarian':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Librarian Staff':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Search and filter methods (client-side filtering)
  onSearchChange(): void {
    // Reset to first page when searching
    this.currentPage = 1;
    this.updateDisplayedAdmins();
  }

  onFilterChange(): void {
    // Reset to first page when filtering
    this.currentPage = 1;
    this.updateDisplayedAdmins();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.sortColumn = 'name';
    this.sortDirection = 'asc';
    this.currentPage = 1;
    this.updateDisplayedAdmins();
  }

  // Filtering and sorting methods (client-side implementation)
  get filteredAdmins(): AdminListItem[] {
    // Return the already filtered and paginated admins
    return this.admins;
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // Apply sorting and update display
    this.updateDisplayedAdmins();
  }

  // Toggle admin block status (following students component pattern)
  toggleAdminBlock(): void {
    if (!this.selectedAdmin) {
      console.log('❌ No admin selected for blocking/unblocking');
      return;
    }

    if (this.isSubmitting) {
      console.log('❌ Already processing, please wait...');
      return;
    }

    this.isSubmitting = true;
    const newStatus = this.selectedAdmin.status === 'Inactive' ? 'Active' : 'Inactive';
    const action = newStatus === 'Inactive' ? 'block' : 'unblock';
    const adminName = this.selectedAdmin.name;
    const adminId = this.selectedAdmin.id;

    console.log(`🔄 ${action}ing admin:`, adminId, adminName, 'New status:', newStatus);

    // Use the update-admin endpoint to change status
    // Only send the status change to avoid name parsing issues
    const updateData = {
      status: newStatus
    };

    console.log('📝 Update data being sent:', updateData);

    this.apiService.updateAdmin(adminId.toString(), updateData).subscribe({
      next: (response: any) => {
        console.log(`✅ ${action} response:`, response);
        if (response && response.success) {
          const actionText = action === 'block' ? 'blocked' : 'unblocked';
          // Clear any existing toasts before showing new one
          this.toastService.clear();
          this.toastService.success(`Admin ${adminName} ${actionText} successfully!`, undefined, 3000);
          this.closeBlockAdminModal();
          // Add small delay before refreshing to prevent rapid API calls
          setTimeout(() => {
            this.refreshAdmins(); // Reload all data from server
          }, 500);
        } else {
          console.log(`❌ ${action} failed:`, response);
          const actionText = action === 'block' ? 'block' : 'unblock';
          this.toastService.clear();
          this.toastService.error(`Failed to ${actionText} admin. Please try again.`);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error(`❌ ${action} API error:`, error);
        this.isSubmitting = false;
        const actionText = action === 'block' ? 'block' : 'unblock';
        this.toastService.clear();
        this.toastService.error(`Failed to ${actionText} admin. Please try again.`);
      }
    });
  }

  // Action methods (for backward compatibility)
  addNewAdmin(): void {
    this.openCreateModal();
  }

  editAdmin(adminId: number): void {
    const admin = this.admins.find(a => a.id === adminId);
    if (admin) {
      this.openEditAdminModal(admin);
    }
  }

  viewAdmin(adminId: number): void {
    const admin = this.admins.find(a => a.id === adminId);
    if (admin) {
      this.openViewAdminModal(admin);
    }
  }

  // Pagination methods (client-side pagination)
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedAdmins(); // Update displayed data for the new page
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedAdmins(); // Update displayed data for the previous page
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedAdmins(); // Update displayed data for the next page
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5; // Same as books component

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getDisplayRange(): string {
    if (this.totalAdmins === 0) return '0 - 0 of 0';

    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalAdmins);

    return `${start} - ${end} of ${this.totalAdmins}`;
  }

  onItemsPerPageChange(): void {
    // Reset to first page when changing items per page
    this.currentPage = 1;
    // Recalculate pagination with new page size
    this.totalPages = Math.ceil(this.totalAdmins / this.itemsPerPage);
    this.updateDisplayedAdmins();
    console.log('📄 Items per page changed to:', this.itemsPerPage);
  }

  // Refresh admins data
  refreshAdmins(): void {
    console.log('🔄 Refreshing admins data...');
    // Clear cached data and reload from server
    this.allAdmins = [];
    this.loadAdmins();
  }

  // Admin Summary modal methods
  openAdminSummaryModal(): void {
    this.showAdminSummaryModal = true;
  }

  closeAdminSummaryModal(): void {
    this.showAdminSummaryModal = false;
  }

  // Get admin statistics for summary
  getAdminStats() {
    const totalAdmins = this.stats.totalAdmins;
    const activeAdmins = this.stats.activeAdmins;
    const inactiveAdmins = this.stats.inactiveAdmins;
    const superAdmins = this.stats.superAdmins;
    const librarians = this.stats.librarians;
    const librarianStaff = this.stats.librarianStaff;
    const dataCenterAdmins = this.stats.dataCenterAdmins;

    // Get role distribution with proper typing
    const roleStats: { [key: string]: number } = {
      'Super Admin': superAdmins,
      'Data Center Admin': dataCenterAdmins,
      'Librarian': librarians,
      'Librarian Staff': librarianStaff
    };

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins,
      superAdmins,
      librarians,
      librarianStaff,
      dataCenterAdmins,
      roleStats
    };
  }

  // Helper method to access Object.keys in template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
