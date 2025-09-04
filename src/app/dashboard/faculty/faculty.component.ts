import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { ThemeService } from '../../services/theme.service';
import { CsvService } from '../../services/csv.service';
import { Faculty, FacultyListItem, FacultyStats, ACADEMIC_DEPARTMENTS, FACULTY_POSITIONS } from '../../interfaces/faculty.interface';

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './faculty.component.html',
  styleUrls: ['./faculty.component.css']
})
export class FacultyComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  error: string | null = null;

  // Modal states
  showAddFacultyModal: boolean = false;
  showEditFacultyModal: boolean = false;
  showViewFacultyModal: boolean = false;
  showBlockFacultyModal: boolean = false;
  showDeleteFacultyModal: boolean = false;
  showImportCsvModal: boolean = false;
  isSubmitting: boolean = false;
  isLoading: boolean = false;

  // CSV related properties
  csvFile: File | null = null;
  csvData: any[] = [];
  csvValidationResults: { valid: any[], invalid: any[] } = { valid: [], invalid: [] };
  csvImportStep: 'upload' | 'validate' | 'import' = 'upload';
  csvImportProgress: number = 0;
  isDragOver: boolean = false;

  // Data properties
  faculty: FacultyListItem[] = [];
  stats: FacultyStats = {
    totalFaculty: 0,
    activeFaculty: 0,
    inactiveFaculty: 0,
    departments: 0,
    departmentCounts: {},
    positionCounts: {}
  };

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalFacultyCount: number = 0;



  // Form data for new faculty
  newFaculty = {
    facultyId: '',
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    email: '',
    phoneNumber: '',
    password: '',
    department: '',
    position: '',
    status: 'Active' as 'Active' | 'Inactive'
  };

  // Validation errors object
  validationErrors = {
    facultyId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    department: '',
    position: ''
  };

  // Selected faculty for modals
  selectedFaculty: FacultyListItem | null = null;
  editFaculty: any = {};
  deleteConfirmation: string = '';
  blockConfirmation: string = '';

  // Search and filter properties
  searchTerm: string = '';
  selectedDepartment: string = '';
  selectedStatus: string = '';
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Subscription management
  private subscriptions: Subscription[] = [];

  // Reference data
  readonly departments = ACADEMIC_DEPARTMENTS;
  readonly positions = FACULTY_POSITIONS;

  constructor(
    private apiService: ApiService,
    private toastService: ToastService,
    private themeService: ThemeService,
    private csvService: CsvService
  ) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    console.log('🎯 FacultyComponent initialized - loading faculty data...');
    this.loadFaculty();

    // Add real faculty data automatically (uncomment to enable)
    // this.addRealFacultyData();
  }

  // Method to add real faculty data with valid information
  public addRealFacultyData(): void {
    const realFacultyData = [
      {
        facultyId: '2024-10001',
        firstName: 'Dr. Maria',
        lastName: 'Santos',
        middleInitial: 'C',
        suffix: '',
        email: 'maria.santos@benedictocollege.edu.ph',
        phoneNumber: '09171234567',
        password: 'FacultyPass123',
        department: 'Computer Science',
        position: 'Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10002',
        firstName: 'Prof. Juan',
        lastName: 'Dela Cruz',
        middleInitial: 'P',
        suffix: '',
        email: 'juan.delacruz@benedictocollege.edu.ph',
        phoneNumber: '09182345678',
        password: 'FacultyPass123',
        department: 'Mathematics',
        position: 'Associate Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10003',
        firstName: 'Dr. Ana',
        lastName: 'Reyes',
        middleInitial: 'L',
        suffix: '',
        email: 'ana.reyes@benedictocollege.edu.ph',
        phoneNumber: '09193456789',
        password: 'FacultyPass123',
        department: 'English',
        position: 'Assistant Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10004',
        firstName: 'Prof. Roberto',
        lastName: 'Garcia',
        middleInitial: 'M',
        suffix: 'Jr.',
        email: 'roberto.garcia@benedictocollege.edu.ph',
        phoneNumber: '09204567890',
        password: 'FacultyPass123',
        department: 'Science',
        position: 'Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10005',
        firstName: 'Dr. Carmen',
        lastName: 'Villanueva',
        middleInitial: 'R',
        suffix: '',
        email: 'carmen.villanueva@benedictocollege.edu.ph',
        phoneNumber: '09215678901',
        password: 'FacultyPass123',
        department: 'Computer Science',
        position: 'Associate Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10006',
        firstName: 'Prof. Antonio',
        lastName: 'Mendoza',
        middleInitial: 'S',
        suffix: '',
        email: 'antonio.mendoza@benedictocollege.edu.ph',
        phoneNumber: '09226789012',
        password: 'FacultyPass123',
        department: 'Mathematics',
        position: 'Lecturer',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10007',
        firstName: 'Dr. Luz',
        lastName: 'Fernandez',
        middleInitial: 'T',
        suffix: '',
        email: 'luz.fernandez@benedictocollege.edu.ph',
        phoneNumber: '09237890123',
        password: 'FacultyPass123',
        department: 'English',
        position: 'Associate Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10008',
        firstName: 'Prof. Eduardo',
        lastName: 'Ramos',
        middleInitial: 'V',
        suffix: '',
        email: 'eduardo.ramos@benedictocollege.edu.ph',
        phoneNumber: '09248901234',
        password: 'FacultyPass123',
        department: 'Science',
        position: 'Assistant Professor',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10009',
        firstName: 'Dr. Isabella',
        lastName: 'Cruz',
        middleInitial: 'M',
        suffix: '',
        email: 'isabella.cruz@benedictocollege.edu.ph',
        phoneNumber: '09259012345',
        password: 'FacultyPass123',
        department: 'Computer Science',
        position: 'Lecturer',
        status: 'Active' as 'Active' | 'Inactive'
      },
      {
        facultyId: '2024-10010',
        firstName: 'Prof. Francisco',
        lastName: 'Morales',
        middleInitial: 'D',
        suffix: 'Sr.',
        email: 'francisco.morales@benedictocollege.edu.ph',
        phoneNumber: '09260123456',
        password: 'FacultyPass123',
        department: 'Mathematics',
        position: 'Professor',
        status: 'Inactive' as 'Active' | 'Inactive'
      }
    ];

    console.log('🎯 Adding real faculty data via API...');

    // Add faculty data with delay to avoid overwhelming the API
    realFacultyData.forEach((faculty, index) => {
      setTimeout(() => {
        console.log(`📝 Adding faculty ${index + 1}/${realFacultyData.length}: ${faculty.firstName} ${faculty.lastName}`);
        this.newFaculty = { ...faculty };
        this.addFaculty();
      }, (index + 1) * 2000); // Add each faculty with 2 second delay
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Data loading methods
  loadFaculty(): void {
    this.loading = true;
    this.error = null;

    console.log('📊 Loading faculty from database...');

    const subscription = this.apiService.getAllFaculty().subscribe({
      next: (response: any) => {
        console.log('✅ Faculty loaded successfully:', response);
        console.log('🔧 Response data:', response.data);
        console.log('🔧 Response count:', response.count);

        if (response.success && response.data) {
          console.log('🔧 Mapping faculty to list items...');
          this.faculty = this.mapFacultyToListItems(response.data);
          console.log('🔧 Mapped faculty:', this.faculty);
          this.calculateStats();
          console.log('🔧 Calculated stats:', this.stats);

          // Initialize pagination
          this.updatePagination();

          // Data loads silently - no toast notification
        } else {
          console.log('❌ API response indicates failure:', response);
          this.error = response.error || 'Failed to load faculty';
          this.toastService.error(this.error || 'Failed to load faculty');
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading faculty:', error);
        this.error = error.error || 'Failed to load faculty';
        this.loading = false;
        this.toastService.error(this.error || 'Failed to load faculty');
      }
    });

    this.subscriptions.push(subscription);
  }

  // Data transformation methods
  private mapFacultyToListItems(faculty: Faculty[]): FacultyListItem[] {
    return faculty.map(fac => ({
      id: fac.FacultyID,
      name: fac.fullName || `${fac.FirstName} ${fac.LastName}`.trim(),
      department: fac.Department || 'Not Assigned',
      position: fac.Position || 'Not Assigned',
      email: fac.Email,
      phoneNumber: fac.PhoneNumber,
      profilePhoto: fac.ProfilePhoto,
      status: fac.Status,
      joinDate: fac.CreatedAt,
      updatedAt: fac.UpdatedAt
    }));
  }

  private calculateStats(): void {
    const departmentCounts: { [key: string]: number } = {};
    const positionCounts: { [key: string]: number } = {};

    // Count departments and positions
    this.faculty.forEach(fac => {
      // Department counts
      if (fac.department && fac.department !== 'Not Assigned') {
        departmentCounts[fac.department] = (departmentCounts[fac.department] || 0) + 1;
      }

      // Position counts
      if (fac.position && fac.position !== 'Not Assigned') {
        positionCounts[fac.position] = (positionCounts[fac.position] || 0) + 1;
      }
    });

    this.stats = {
      totalFaculty: this.faculty.length,
      activeFaculty: this.faculty.filter(f => f.status === 'Active').length,
      inactiveFaculty: this.faculty.filter(f => f.status === 'Inactive').length,
      departments: Object.keys(departmentCounts).length,
      departmentCounts,
      positionCounts
    };
  }

  // UI helper methods
  getTextClasses(): string {
    return this.isDarkMode ? 'text-white' : 'text-gray-900';
  }

  getSecondaryTextClasses(): string {
    return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
  }

  getCardClasses(): string {
    return this.isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-900';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }

  // Modal control methods
  openAddFacultyModal(): void {
    console.log('🔓 Opening add faculty modal');
    this.showAddFacultyModal = true;
    this.resetForm();
  }

  closeAddFacultyModal(): void {
    this.showAddFacultyModal = false;
    this.resetForm();
  }

  openEditFacultyModal(faculty: FacultyListItem): void {
    console.log('🔧 Opening edit modal for faculty:', faculty);
    this.selectedFaculty = faculty;
    this.editFaculty = {
      facultyId: faculty.id,
      firstName: faculty.name.split(' ')[0] || '',
      lastName: faculty.name.split(' ').slice(1).join(' ') || '',
      middleInitial: '',
      suffix: '',
      email: faculty.email,
      phoneNumber: faculty.phoneNumber || '',
      department: faculty.department,
      position: faculty.position,
      status: faculty.status
    };
    this.showEditFacultyModal = true;
  }

  closeEditFacultyModal(): void {
    this.showEditFacultyModal = false;
    this.selectedFaculty = null;
    this.editFaculty = {};
  }

  openViewFacultyModal(faculty: FacultyListItem): void {
    console.log('🔧 Opening view modal for faculty:', faculty);
    this.selectedFaculty = faculty;
    this.showViewFacultyModal = true;
  }

  closeViewFacultyModal(): void {
    this.showViewFacultyModal = false;
    this.selectedFaculty = null;
  }

  openBlockFacultyModal(faculty: FacultyListItem): void {
    this.selectedFaculty = faculty;
    this.showBlockFacultyModal = true;
  }

  closeBlockFacultyModal(): void {
    this.showBlockFacultyModal = false;
    this.selectedFaculty = null;
    this.blockConfirmation = '';
  }

  openDeleteFacultyModal(faculty: FacultyListItem): void {
    this.selectedFaculty = faculty;
    this.showDeleteFacultyModal = true;
  }

  closeDeleteFacultyModal(): void {
    this.showDeleteFacultyModal = false;
    this.selectedFaculty = null;
    this.deleteConfirmation = '';
  }

  openDeleteFromView(): void {
    if (this.selectedFaculty) {
      this.closeViewFacultyModal();
      this.openDeleteFacultyModal(this.selectedFaculty);
    }
  }

  openEditFromView(): void {
    if (this.selectedFaculty) {
      this.closeViewFacultyModal();
      this.openEditFacultyModal(this.selectedFaculty);
    }
  }



  // Search and filter methods
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  onSearchChange(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.applyFilters();
  }

  // Sorting methods
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // Filtered and sorted faculty getter
  get filteredFaculty(): FacultyListItem[] {
    let filtered = [...this.faculty];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(faculty =>
        faculty.name.toLowerCase().includes(search) ||
        faculty.email.toLowerCase().includes(search) ||
        faculty.department.toLowerCase().includes(search)
      );
    }

    // Apply department filter
    if (this.selectedDepartment) {
      filtered = filtered.filter(faculty => faculty.department === this.selectedDepartment);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(faculty => faculty.status === this.selectedStatus);
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
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate || '').getTime();
          bValue = new Date(b.joinDate || '').getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
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

  // Form validation and utility methods
  resetForm(): void {
    this.newFaculty = {
      facultyId: '',
      firstName: '',
      lastName: '',
      middleInitial: '',
      suffix: '',
      email: '',
      phoneNumber: '',
      password: '',
      department: '',
      position: '',
      status: 'Active'
    };
    this.validationErrors = {
      facultyId: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      department: '',
      position: ''
    };
  }

  isFormValid(): boolean {
    let isValid = true;
    this.resetValidationErrors();

    // Faculty ID validation (required and format)
    if (!this.newFaculty.facultyId.trim()) {
      this.validationErrors.facultyId = 'Faculty ID is required';
      isValid = false;
    } else if (!this.isValidFacultyId(this.newFaculty.facultyId)) {
      this.validationErrors.facultyId = 'Faculty ID must be in format YYYY-NNNNN or YYYY-NNNNNN (e.g., 2024-12345)';
      isValid = false;
    }

    // Required field validations
    if (!this.newFaculty.firstName.trim()) {
      this.validationErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!this.newFaculty.lastName.trim()) {
      this.validationErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!this.newFaculty.email.trim()) {
      this.validationErrors.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.newFaculty.email)) {
      this.validationErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.newFaculty.password.trim()) {
      this.validationErrors.password = 'Password is required';
      isValid = false;
    } else if (this.newFaculty.password.length < 6) {
      this.validationErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (!this.newFaculty.department.trim()) {
      this.validationErrors.department = 'Department is required';
      isValid = false;
    }

    if (!this.newFaculty.position.trim()) {
      this.validationErrors.position = 'Position is required';
      isValid = false;
    }

    // Phone number validation (if provided)
    if (this.newFaculty.phoneNumber && !this.isValidPhoneNumber(this.newFaculty.phoneNumber)) {
      this.validationErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }

    return isValid;
  }

  private resetValidationErrors(): void {
    Object.keys(this.validationErrors).forEach(key => {
      (this.validationErrors as any)[key] = '';
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Remove spaces, dashes, parentheses, and other formatting
    const cleanPhone = phone.replace(/[\s\-\(\)\+\.]/g, '');

    // Allow phone numbers with 7-15 digits, can start with 0
    const phoneRegex = /^[0-9]{7,15}$/;
    return phoneRegex.test(cleanPhone);
  }

  private isValidFacultyId(facultyId: string): boolean {
    // Faculty ID must be in format YYYY-NNNNN or YYYY-NNNNNN
    const facultyIdRegex = /^\d{4}-\d{5,6}$/;
    return facultyIdRegex.test(facultyId);
  }

  // CRUD operations
  addFaculty(): void {
    console.log('🔄 Add faculty method called');
    console.log('📝 Current form data:', this.newFaculty);

    // Validate form before submission
    if (!this.isFormValid()) {
      console.log('❌ Form validation failed');
      console.log('🔍 Validation errors:', this.validationErrors);
      this.toastService.error('Please fix the errors in the form before submitting');
      return;
    }

    if (this.isSubmitting) {
      console.log('⏳ Already submitting, ignoring duplicate request');
      return;
    }

    this.isSubmitting = true;
    console.log('✅ Form validation passed, submitting...');

    // Prepare faculty data for API
    const facultyData = {
      facultyId: this.newFaculty.facultyId, // Required field
      firstName: this.newFaculty.firstName,
      lastName: this.newFaculty.lastName,
      middleInitial: this.newFaculty.middleInitial || '',
      suffix: this.newFaculty.suffix || '',
      email: this.newFaculty.email,
      phoneNumber: this.newFaculty.phoneNumber || '',
      password: this.newFaculty.password,
      department: this.newFaculty.department,
      position: this.newFaculty.position,
      status: this.newFaculty.status
    };

    // Use the API service to register the faculty
    console.log('🚀 Submitting faculty data to API:', facultyData);
    this.apiService.post('/facultyauth/register-faculty', facultyData).subscribe({
      next: (response: any) => {
        console.log('✅ API Response received:', response);

        if (response && response.success) {
          // Close modal and show success message
          this.closeAddFacultyModal();
          const facultyName = `${facultyData.firstName} ${facultyData.lastName}`;
          this.toastService.success(`Faculty ${facultyName} added successfully!`);

          // Reload faculty from database to get the latest data
          this.loadFaculty();
        } else {
          console.log('❌ API returned unsuccessful response:', response);
          this.isSubmitting = false;
          const errorMessage = response.error || 'Failed to add faculty. Please try again.';
          this.toastService.error(errorMessage);
        }
      },
      error: (error) => {
        console.error('❌ Failed to add faculty:', error);
        this.isSubmitting = false;

        // Handle specific error messages
        if (error.error && error.error.error) {
          this.toastService.error(error.error.error);
        } else {
          this.toastService.error('Failed to add faculty. Please try again.');
        }
      }
    });
  }

  // Update faculty
  updateFaculty(): void {
    if (!this.selectedFaculty || !this.editFaculty) {
      return;
    }

    this.isSubmitting = true;

    // Prepare update data - only send fields that might have changed
    const updateData: any = {
      firstName: this.editFaculty.firstName,
      lastName: this.editFaculty.lastName,
      middleInitial: this.editFaculty.middleInitial || '',
      suffix: this.editFaculty.suffix || '',
      email: this.editFaculty.email,
      phoneNumber: this.editFaculty.phoneNumber || '',
      department: this.editFaculty.department,
      position: this.editFaculty.position,
      status: this.editFaculty.status
    };

    console.log('🔄 Updating faculty:', this.selectedFaculty.id, updateData);

    // Call API to update faculty
    this.apiService.updateFaculty(this.selectedFaculty.id, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          const facultyName = `${this.editFaculty.firstName} ${this.editFaculty.lastName}`;
          this.toastService.success(`Faculty ${facultyName} updated successfully!`);
          this.closeEditFacultyModal();
          this.loadFaculty(); // Reload the list
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Failed to update faculty:', error);
        this.toastService.error('Failed to update faculty. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  // Block/Unblock faculty
  blockFaculty(): void {
    if (!this.selectedFaculty) {
      return;
    }

    this.isSubmitting = true;
    const newStatus = this.selectedFaculty.status === 'Inactive' ? 'Active' : 'Inactive';
    const action = newStatus === 'Inactive' ? 'block' : 'unblock';
    const facultyName = this.selectedFaculty.name;
    const facultyId = this.selectedFaculty.id;

    console.log(`🔄 ${action}ing faculty:`, facultyId, facultyName, 'New status:', newStatus);

    // Use the update-faculty endpoint to change status
    const updateData: any = {
      status: newStatus
    };

    this.apiService.updateFaculty(facultyId, updateData).subscribe({
      next: (response: any) => {
        console.log(`✅ ${action} response:`, response);
        if (response && response.success) {
          const actionText = action === 'block' ? 'blocked' : 'unblocked';
          this.toastService.success(`Faculty ${facultyName} ${actionText} successfully!`);
          this.closeBlockFacultyModal();
          this.loadFaculty(); // Reload the list
        } else {
          console.log(`❌ ${action} failed:`, response);
          const actionText = action === 'block' ? 'block' : 'unblock';
          this.toastService.error(`Failed to ${actionText} faculty. Please try again.`);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error(`❌ ${action} API error:`, error);
        this.isSubmitting = false;
        const actionText = action === 'block' ? 'block' : 'unblock';
        this.toastService.error(`Failed to ${actionText} faculty. Please try again.`);
      }
    });
  }

  // Delete faculty permanently
  deleteFaculty(): void {
    if (!this.selectedFaculty) {
      return;
    }

    if (this.deleteConfirmation !== 'DELETE') {
      this.toastService.error('Please type "DELETE" to confirm');
      return;
    }

    this.isSubmitting = true;
    const facultyName = this.selectedFaculty.name;
    const facultyId = this.selectedFaculty.id;

    console.log('🗑️ Deleting faculty:', facultyId, facultyName);

    this.apiService.deleteFaculty(facultyId).subscribe({
      next: (response: any) => {
        console.log('✅ Delete response:', response);
        if (response && response.success) {
          this.toastService.success(`Faculty ${facultyName} deleted successfully!`);
          this.closeDeleteFacultyModal();
          this.loadFaculty(); // Reload the list
        } else {
          console.log('❌ Delete failed:', response);
          this.toastService.error('Failed to delete faculty. Please try again.');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Delete API error:', error);
        this.isSubmitting = false;
        this.toastService.error('Failed to delete faculty. Please try again.');
      }
    });
  }

  // Action methods (updated)

  editFacultyAction(facultyId: string): void {
    const faculty = this.faculty.find(f => f.id === facultyId);
    if (faculty) {
      this.openEditFacultyModal(faculty);
    }
  }

  viewFacultyAction(facultyId: string): void {
    const faculty = this.faculty.find(f => f.id === facultyId);
    if (faculty) {
      this.openViewFacultyModal(faculty);
    }
  }

  blockFacultyAction(facultyId: string): void {
    const faculty = this.faculty.find(f => f.id === facultyId);
    if (faculty) {
      this.openBlockFacultyModal(faculty);
    }
  }

  deleteFacultyAction(facultyId: string): void {
    const faculty = this.faculty.find(f => f.id === facultyId);
    if (faculty) {
      this.openDeleteFacultyModal(faculty);
    }
  }

  // Filtering and search methods
  applyFilters(): void {
    // This method now just triggers pagination update since filtering is handled by the getter
    this.updatePagination();
  }



  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

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
    if (this.totalFacultyCount === 0) return '0 - 0 of 0';

    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalFacultyCount);

    return `${start} - ${end} of ${this.totalFacultyCount}`;
  }

  onItemsPerPageChange(): void {
    // Reset to first page when changing items per page
    this.currentPage = 1;
    this.updatePagination();
    console.log('📄 Items per page changed to:', this.itemsPerPage);
  }

  private updatePagination(): void {
    // Update total pages based on filtered faculty
    this.totalFacultyCount = this.filteredFaculty.length;
    this.totalPages = Math.ceil(this.totalFacultyCount / this.itemsPerPage);

    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  // Get faculty for current page
  getPaginatedFaculty(): FacultyListItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredFaculty.slice(startIndex, endIndex);
  }

  // Utility methods for template
  get facultyMembers(): FacultyListItem[] {
    return this.getPaginatedFaculty();
  }

  // CSV Import/Export Methods
  openImportCsvModal(): void {
    this.showImportCsvModal = true;
    this.csvImportStep = 'upload';
    this.csvFile = null;
    this.csvData = [];
    this.csvValidationResults = { valid: [], invalid: [] };
  }

  closeImportCsvModal(): void {
    this.showImportCsvModal = false;
    this.csvImportStep = 'upload';
    this.csvFile = null;
    this.csvData = [];
    this.csvValidationResults = { valid: [], invalid: [] };
  }

  onCsvFileSelected(event: any): void {
    const file = event.target.files[0];
    this.handleFileSelection(file);
  }

  // Drag and drop event handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    if (!file) {
      this.toastService.error('No file selected');
      return;
    }

    // Check file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'csv') {
      this.toastService.error('Please select a CSV file (.csv extension required)');
      return;
    }

    // Check MIME type
    if (file.type && file.type !== 'text/csv' && file.type !== 'application/csv') {
      this.toastService.error('Please select a valid CSV file');
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.toastService.error('File size must be less than 10MB');
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      this.toastService.error('Selected file is empty');
      return;
    }

    this.csvFile = file;
    this.readCsvFile();
  }

  private readCsvFile(): void {
    if (!this.csvFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        
        if (!csvContent || csvContent.trim().length === 0) {
          this.toastService.error('CSV file is empty or could not be read');
          return;
        }

        // Check if file has content
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
          this.toastService.error('CSV file must contain at least a header row and one data row');
          return;
        }

        const headers = ['facultyId', 'firstName', 'lastName', 'middleInitial', 'suffix', 'email', 'phoneNumber', 'password', 'department', 'position', 'status'];
        
        // Validate CSV headers (case-insensitive) - password is now optional for security
        const firstLine = lines[0].toLowerCase();
        const requiredHeaders = ['firstname', 'lastname', 'email', 'department', 'position'];
        const missingHeaders = requiredHeaders.filter(header => {
          // Check if header exists in any common format variations
          const variations = [
            header,
            header.charAt(0).toUpperCase() + header.slice(1), // FirstName
            header.toUpperCase(), // FIRSTNAME
            header.replace(/([A-Z])/g, '_$1').toLowerCase(), // first_name
            header.replace(/([A-Z])/g, '-$1').toLowerCase()  // first-name
          ];
          return !variations.some(variation => firstLine.includes(variation.toLowerCase()));
        });
        
        if (missingHeaders.length > 0) {
          this.toastService.error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        this.csvData = this.csvService.parseCsv(csvContent, headers);
        
        if (this.csvData.length === 0) {
          this.toastService.error('No valid data found in CSV file');
          return;
        }

        this.csvValidationResults = this.csvService.validateFacultyData(this.csvData);
        this.csvImportStep = 'validate';
        
        if (this.csvValidationResults.valid.length === 0 && this.csvValidationResults.invalid.length > 0) {
          this.toastService.warning('No valid faculty found in CSV file. Please check the validation errors.');
        }
      } catch (error) {
        console.error('Error reading CSV file:', error);
        this.toastService.error('Error reading CSV file. Please ensure it is properly formatted.');
      }
    };
    
    reader.onerror = () => {
      this.toastService.error('Error reading file. Please try again.');
    };
    
    reader.readAsText(this.csvFile);
  }

  importValidFaculty(): void {
    if (this.csvValidationResults.valid.length === 0) {
      this.toastService.error('No valid faculty to import');
      return;
    }

    this.isSubmitting = true;
    this.csvImportProgress = 0;
    const validFaculty = this.csvValidationResults.valid;
    let importedCount = 0;
    let errorCount = 0;

    // Import faculty one by one with progress tracking
    const importNext = (index: number) => {
      if (index >= validFaculty.length) {
        this.isSubmitting = false;
        this.toastService.success(`Import completed! ${importedCount} faculty imported successfully.`);
        if (errorCount > 0) {
          this.toastService.warning(`${errorCount} faculty failed to import.`);
        }
        this.closeImportCsvModal();
        this.loadFaculty(); // Refresh the list
        return;
      }

      const faculty = validFaculty[index];
      this.csvImportProgress = Math.round(((index + 1) / validFaculty.length) * 100);

      this.apiService.post('/facultyauth/register-faculty', faculty).subscribe({
        next: (response: any) => {
          if (response.success) {
            importedCount++;
          } else {
            errorCount++;
          }
          importNext(index + 1);
        },
        error: (error) => {
          console.error('Error importing faculty:', error);
          errorCount++;
          importNext(index + 1);
        }
      });
    };

    importNext(0);
  }

  exportToCsv(): void {
    if (this.faculty.length === 0) {
      this.toastService.warning('No faculty to export');
      return;
    }

    const headers = ['facultyId', 'firstName', 'lastName', 'middleInitial', 'suffix', 'email', 'phoneNumber', 'department', 'position', 'status', 'joinDate'];
    const exportData = this.faculty.map(faculty => ({
      facultyId: faculty.id,
      firstName: faculty.name.split(' ')[0] || '',
      lastName: faculty.name.split(' ').slice(1).join(' ') || '',
      middleInitial: '', // Not available in current data structure
      suffix: '',
      email: faculty.email,
      phoneNumber: faculty.phoneNumber || '',
      department: faculty.department,
      position: faculty.position,
      status: faculty.status,
      joinDate: faculty.joinDate
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    this.csvService.generateCsv(exportData, headers, `faculty_export_${timestamp}.csv`);
    this.toastService.success('Faculty exported successfully!');
  }

  downloadFacultyTemplate(): void {
    this.csvService.generateFacultyTemplate();
    this.toastService.info('Faculty CSV template downloaded!');
  }
}
