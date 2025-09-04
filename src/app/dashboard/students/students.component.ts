import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { ThemeService } from '../../services/theme.service';
import { CsvService } from '../../services/csv.service';
import { Subscription } from 'rxjs';

// Interface for Student data from database
interface Student {
  StudentID: string;
  FirstName: string;
  LastName: string;
  MiddleInitial?: string;
  Suffix?: string;
  Course: string;
  YearLevel: number;
  Section?: string;
  Email: string;
  PhoneNumber?: string;
  EnrollmentStatus: 'Active' | 'Inactive';
  AccountStatus: 'Allowed' | 'Blocked';
  CreatedAt: string;
  UpdatedAt: string;
  fullName?: string; // Computed field from backend
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit, OnDestroy {
  private themeSubscription: Subscription = new Subscription();
  showAddStudentModal: boolean = false;
  showEditStudentModal: boolean = false;
  showViewStudentModal: boolean = false;
  showBlockStudentModal: boolean = false;
  showDeleteStudentModal: boolean = false;
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

  newStudent = {
    studentID: '',
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    course: '',
    yearLevel: '',
    section: '',
    email: '',
    phoneNumber: '',
    password: ''
  };

  // Validation errors object
  validationErrors = {
    studentID: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    course: '',
    yearLevel: ''
  };

  // Real students data from database
  students: Student[] = [];
  filteredStudents: Student[] = [];
  allStudents: Student[] = []; // Keep for compatibility with existing methods
  searchTerm: string = '';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10; // Same default as admins component
  totalPages: number = 0;
  totalStudents: number = 0;
  
  // Filter properties
  selectedCourse: string = '';
  selectedYearLevel: string = '';
  selectedStatus: string = '';
  
  // Sorting properties
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Loading and error states
  loading: boolean = false;
  error: string | null = null;

  // Selected student for modals
  selectedStudent: Student | null = null;
  editStudent: any = {};
  deleteConfirmation: string = '';

  // Statistics
  activeStudents: number = 0;
  inactiveStudents: number = 0;
  blockedStudents: number = 0;

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
    // Load students from database
    this.loadStudents();
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }

  // Load students from database
  loadStudents(): void {
    this.loading = true;
    this.error = null;
    console.log('🔄 Loading students from database...');

    this.apiService.get('/auth/get-all-students').subscribe({
      next: (response: any) => {
        console.log('✅ Students loaded successfully:', response);
        if (response.success && response.data) {
          this.students = response.data;
          this.applyFiltersAndSort();
          this.updateStatistics();
          console.log(`📚 ${response.count} students loaded from database successfully`);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Failed to load students:', error);
        this.error = 'Failed to load students from database';
        this.toastService.error('Failed to load students from database');
        this.loading = false;
      }
    });
  }

  // Update statistics based on loaded students
  updateStatistics(): void {
    this.totalStudents = this.students.length;
    this.activeStudents = this.students.filter(s => s.EnrollmentStatus === 'Active' && s.AccountStatus === 'Allowed').length;
    this.inactiveStudents = this.students.filter(s => s.EnrollmentStatus === 'Inactive').length;
    this.blockedStudents = this.students.filter(s => s.AccountStatus === 'Blocked').length;
  }

  // Search functionality
  onSearch(): void {
    this.applyFiltersAndSort();
  }

  // Filter change handler
  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  // Sort functionality
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  // Apply filters and sorting
  private applyFiltersAndSort(): void {
    let filtered = [...this.students];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.fullName?.toLowerCase().includes(term) ||
        student.StudentID.toLowerCase().includes(term) ||
        student.Email.toLowerCase().includes(term) ||
        student.Course.toLowerCase().includes(term)
      );
    }

    // Apply course filter
    if (this.selectedCourse) {
      filtered = filtered.filter(student => student.Course === this.selectedCourse);
    }

    // Apply year level filter
    if (this.selectedYearLevel) {
      filtered = filtered.filter(student => student.YearLevel.toString() === this.selectedYearLevel);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(student => {
        const status = this.getStatusText(student);
        return status === this.selectedStatus;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = (a.fullName || `${a.FirstName} ${a.LastName}`).toLowerCase();
          bValue = (b.fullName || `${b.FirstName} ${b.LastName}`).toLowerCase();
          break;
        case 'course':
          aValue = a.Course.toLowerCase();
          bValue = b.Course.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.CreatedAt).getTime();
          bValue = new Date(b.CreatedAt).getTime();
          break;
        case 'status':
          aValue = this.getStatusText(a);
          bValue = this.getStatusText(b);
          break;
        default:
          aValue = (a.fullName || `${a.FirstName} ${a.LastName}`).toLowerCase();
          bValue = (b.fullName || `${b.FirstName} ${b.LastName}`).toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredStudents = filtered;
    this.updatePagination();
  }

  openAddStudentModal(): void {
    console.log('🔓 Opening add student modal');
    this.showAddStudentModal = true;
    this.resetForm();
  }

  closeAddStudentModal(): void {
    this.showAddStudentModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newStudent = {
      studentID: '',
      firstName: '',
      lastName: '',
      middleInitial: '',
      suffix: '',
      course: '',
      yearLevel: '',
      section: '',
      email: '',
      phoneNumber: '',
      password: ''
    };
    this.validationErrors = {
      studentID: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      course: '',
      yearLevel: ''
    };
    this.isSubmitting = false;
  }

  addStudent(): void {
    console.log('🔄 Add student method called');
    console.log('📝 Current form data:', this.newStudent);

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

    // Convert yearLevel to number for API
    const studentData = {
      studentID: this.newStudent.studentID || '', // Allow empty for auto-generation
      firstName: this.newStudent.firstName,
      lastName: this.newStudent.lastName,
      middleInitial: this.newStudent.middleInitial || '',
      suffix: this.newStudent.suffix || '',
      course: this.newStudent.course,
      yearLevel: parseInt(this.newStudent.yearLevel),
      section: this.newStudent.section || '',
      email: this.newStudent.email,
      phoneNumber: this.newStudent.phoneNumber || '',
      password: this.newStudent.password
    };

    // Use the API service to register the student
    console.log('🚀 Submitting student data to API:', studentData);
    this.apiService.post('/auth/register-student', studentData).subscribe({
      next: (response: any) => {
        console.log('✅ API Response received:', response);

        if (response && response.success) {
          // Close modal and show success message
          this.closeAddStudentModal();
          const studentName = `${studentData.firstName} ${studentData.lastName}`;
          this.toastService.success(`Student ${studentName} added successfully!`);

          // Reload students from database to get the latest data
          this.loadStudents();
        } else {
          console.log('❌ API returned unsuccessful response:', response);
          this.isSubmitting = false;
          this.toastService.error('Failed to add student. Please try again.');
        }
      },
      error: (error) => {
        console.error('❌ API Error:', error);
        this.isSubmitting = false;
        this.toastService.error('Failed to add student. Please try again.');
      }
    });
  }

  private getYearSuffix(year: number): string {
    switch(year) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      case 4: return 'th';
      default: return 'th';
    }
  }

  // Modal Methods
  openEditStudentModal(student: Student): void {
    this.selectedStudent = student;
    this.editStudent = {
      studentID: student.StudentID,
      firstName: student.FirstName,
      lastName: student.LastName,
      middleInitial: student.MiddleInitial || '',
      suffix: student.Suffix || '',
      course: student.Course,
      yearLevel: student.YearLevel.toString(),
      section: student.Section || '',
      email: student.Email,
      phoneNumber: student.PhoneNumber || '',
      enrollmentStatus: student.EnrollmentStatus,
      accountStatus: student.AccountStatus
    };
    this.showEditStudentModal = true;
  }

  closeEditStudentModal(): void {
    this.showEditStudentModal = false;
    this.selectedStudent = null;
    this.editStudent = {};
  }

  openViewStudentModal(student: Student): void {
    this.selectedStudent = student;
    this.showViewStudentModal = true;
  }

  closeViewStudentModal(): void {
    this.showViewStudentModal = false;
    this.selectedStudent = null;
  }

  openBlockStudentModal(student: Student): void {
    this.selectedStudent = student;
    this.showBlockStudentModal = true;
  }

  closeBlockStudentModal(): void {
    this.showBlockStudentModal = false;
    this.selectedStudent = null;
  }

  openDeleteStudentModal(student: Student): void {
    this.selectedStudent = student;
    this.showDeleteStudentModal = true;
  }

  closeDeleteStudentModal(): void {
    this.showDeleteStudentModal = false;
    this.selectedStudent = null;
    this.deleteConfirmation = '';
  }

  // Method to handle transition from view modal to delete modal
  openDeleteFromView(): void {
    if (!this.selectedStudent) {
      return;
    }

    // Store the student reference before closing view modal
    const studentToDelete = this.selectedStudent;

    // Close view modal
    this.showViewStudentModal = false;

    // Open delete modal with stored reference
    this.selectedStudent = studentToDelete;
    this.showDeleteStudentModal = true;
  }



  // Update student information
  updateStudent(): void {
    if (!this.selectedStudent) return;

    this.isSubmitting = true;
    const updateData = {
      studentID: this.editStudent.studentID,
      firstName: this.editStudent.firstName,
      lastName: this.editStudent.lastName,
      middleInitial: this.editStudent.middleInitial || '',
      suffix: this.editStudent.suffix || '',
      course: this.editStudent.course,
      yearLevel: parseInt(this.editStudent.yearLevel),
      section: this.editStudent.section || '',
      email: this.editStudent.email,
      phoneNumber: this.editStudent.phoneNumber || '',
      enrollmentStatus: this.editStudent.enrollmentStatus,
      accountStatus: this.editStudent.accountStatus
    };

    // Call API to update student
    this.apiService.put(`/auth/update-student/${this.selectedStudent.StudentID}`, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          const studentName = `${this.editStudent.firstName} ${this.editStudent.lastName}`;
          this.toastService.success(`Student ${studentName} updated successfully!`);
          this.closeEditStudentModal();
          this.loadStudents(); // Reload the list
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Failed to update student:', error);
        let errorMessage = 'Failed to update student. Please try again.';

        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.toastService.error(errorMessage);
        this.isSubmitting = false;
      }
    });
  }

  // Toggle student block status
  toggleStudentBlock(): void {
    if (!this.selectedStudent) {
      console.log('❌ No student selected for blocking/unblocking');
      return;
    }

    this.isSubmitting = true;
    const newStatus = this.selectedStudent.AccountStatus === 'Blocked' ? 'Allowed' : 'Blocked';
    const action = newStatus === 'Blocked' ? 'block' : 'unblock';
    const studentName = this.selectedStudent.fullName || `${this.selectedStudent.FirstName} ${this.selectedStudent.LastName}`;
    const studentID = this.selectedStudent.StudentID;

    console.log(`🔄 ${action}ing student:`, studentID, studentName, 'New status:', newStatus);

    // Use the update-student endpoint to change account status
    // Only send fields that are actually changing to avoid validation issues
    const updateData: any = {
      accountStatus: newStatus
    };

    // Only include phone number if it's in the correct format or empty
    const phoneNumber = this.selectedStudent.PhoneNumber;
    if (phoneNumber && phoneNumber !== 'N/A') {
      // Check if phone number matches the required format
      if (/^09\d{9}$/.test(phoneNumber)) {
        updateData.phoneNumber = phoneNumber;
      }
      // If it doesn't match, don't include it to avoid validation error
    }

    console.log('📝 Update data being sent:', updateData);

    this.apiService.put(`/auth/update-student/${studentID}`, updateData).subscribe({
      next: (response: any) => {
        console.log(`✅ ${action} response:`, response);
        if (response && response.success) {
          const actionText = action === 'block' ? 'blocked' : 'unblocked';
          this.toastService.success(`Student ${studentName} ${actionText} successfully!`);
          this.closeBlockStudentModal();
          this.loadStudents(); // Reload the list
        } else {
          console.log(`❌ ${action} failed:`, response);
          const actionText = action === 'block' ? 'block' : 'unblock';
          this.toastService.error(`Failed to ${actionText} student. Please try again.`);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error(`❌ ${action} API error:`, error);
        this.isSubmitting = false;
        const actionText = action === 'block' ? 'block' : 'unblock';
        this.toastService.error(`Failed to ${actionText} student. Please try again.`);
      }
    });
  }

  // Delete student permanently
  deleteStudent(): void {
    if (!this.selectedStudent) {
      return;
    }

    if (this.deleteConfirmation !== 'DELETE') {
      this.toastService.error('Please type "DELETE" to confirm');
      return;
    }

    this.isSubmitting = true;
    const studentName = this.selectedStudent.fullName || `${this.selectedStudent.FirstName} ${this.selectedStudent.LastName}`;
    const studentID = this.selectedStudent.StudentID;

    console.log('🗑️ Deleting student:', studentID, studentName);

    this.apiService.delete(`/auth/delete-student/${studentID}`).subscribe({
      next: (response: any) => {
        console.log('✅ Delete response:', response);
        if (response && response.success) {
          this.toastService.success(`Student ${studentName} deleted successfully!`);
          this.closeDeleteStudentModal();
          this.loadStudents(); // Reload the list
        } else {
          console.log('❌ Delete failed:', response);
          this.toastService.error('Failed to delete student. Please try again.');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Delete API error:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        this.isSubmitting = false;

        let errorMessage = 'Failed to delete student. Please try again.';

        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.toastService.error(errorMessage);
      }
    });
  }



  // Validation methods
  validateStudentID(): void {
    const studentID = this.newStudent.studentID.trim();
    // Student ID is optional - if provided, it must match the format
    if (studentID && !/^\d{4}-\d{5}$/.test(studentID)) {
      this.validationErrors.studentID = 'Student ID must be in format YYYY-NNNNN (e.g., 2025-00001) or leave empty for auto-generation';
    } else {
      this.validationErrors.studentID = '';
    }
  }

  validateFirstName(): void {
    const firstName = this.newStudent.firstName.trim();
    if (!firstName) {
      this.validationErrors.firstName = 'First name is required';
    } else if (firstName.length > 100) {
      this.validationErrors.firstName = 'First name must not exceed 100 characters';
    } else {
      this.validationErrors.firstName = '';
    }
  }

  validateLastName(): void {
    const lastName = this.newStudent.lastName.trim();
    if (!lastName) {
      this.validationErrors.lastName = 'Last name is required';
    } else if (lastName.length > 100) {
      this.validationErrors.lastName = 'Last name must not exceed 100 characters';
    } else {
      this.validationErrors.lastName = '';
    }
  }

  validateEmail(): void {
    const email = this.newStudent.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      this.validationErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      this.validationErrors.email = 'Please provide a valid email address';
    } else {
      this.validationErrors.email = '';
    }
  }

  validatePhoneNumber(): void {
    const phoneNumber = this.newStudent.phoneNumber.trim();
    if (!phoneNumber) {
      this.validationErrors.phoneNumber = 'Phone number is required';
    } else if (!/^09\d{9}$/.test(phoneNumber)) {
      this.validationErrors.phoneNumber = 'Phone number must be in format 09XXXXXXXXX (11 digits starting with 09)';
    } else {
      this.validationErrors.phoneNumber = '';
    }
  }

  validatePassword(): void {
    const password = this.newStudent.password;
    if (!password) {
      this.validationErrors.password = 'Password is required';
    } else if (password.length < 6) {
      this.validationErrors.password = 'Password must be at least 6 characters long';
    } else if (!/(?=.*[a-z])/.test(password)) {
      this.validationErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(password)) {
      this.validationErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(password)) {
      this.validationErrors.password = 'Password must contain at least one number';
    } else {
      this.validationErrors.password = '';
    }
  }

  validateCourse(): void {
    if (!this.newStudent.course) {
      this.validationErrors.course = 'Course is required';
    } else {
      this.validationErrors.course = '';
    }
  }

  validateYearLevel(): void {
    if (!this.newStudent.yearLevel) {
      this.validationErrors.yearLevel = 'Year level is required';
    } else {
      this.validationErrors.yearLevel = '';
    }
  }

  // Check if form is valid
  isFormValid(): boolean {
    // Validate all fields
    this.validateStudentID();
    this.validateFirstName();
    this.validateLastName();
    this.validateEmail();
    this.validatePhoneNumber();
    this.validatePassword();
    this.validateCourse();
    this.validateYearLevel();

    // Check if any errors exist
    return Object.values(this.validationErrors).every(error => error === '');
  }

  // Get password strength indicator
  getPasswordStrength(): { strength: string, color: string, width: string } {
    const password = this.newStudent.password;
    if (!password) return { strength: '', color: '', width: '0%' };

    let score = 0;
    if (password.length >= 6) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (password.length >= 8) score++;

    switch (score) {
      case 0:
      case 1:
        return { strength: 'Very Weak', color: 'bg-red-500', width: '20%' };
      case 2:
        return { strength: 'Weak', color: 'bg-orange-500', width: '40%' };
      case 3:
        return { strength: 'Fair', color: 'bg-yellow-500', width: '60%' };
      case 4:
        return { strength: 'Good', color: 'bg-blue-500', width: '80%' };
      case 5:
        return { strength: 'Strong', color: 'bg-green-500', width: '100%' };
      default:
        return { strength: '', color: '', width: '0%' };
    }
  }

  // Helper method to get initials from full name
  getInitials(fullName: string): string {
    if (!fullName) return '??';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Helper method to get year level text
  getYearLevelText(yearLevel: number): string {
    if (!yearLevel) return 'N/A';
    const suffix = this.getYearSuffix(yearLevel);
    return `${yearLevel}${suffix} Year`;
  }

  // Helper method to get status text
  getStatusText(student: Student): string {
    if (student.AccountStatus === 'Blocked') return 'Blocked';
    if (student.EnrollmentStatus === 'Inactive') return 'Inactive';
    return 'Active';
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
    if (this.totalStudents === 0) return '0 - 0 of 0';

    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalStudents);

    return `${start} - ${end} of ${this.totalStudents}`;
  }

  onItemsPerPageChange(): void {
    // Reset to first page when changing items per page
    this.currentPage = 1;
    this.updatePagination();
    console.log('📄 Items per page changed to:', this.itemsPerPage);
  }

  private updatePagination(): void {
    // Update total pages based on filtered students
    this.totalStudents = this.filteredStudents.length;
    this.totalPages = Math.ceil(this.totalStudents / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  // Get students for current page
  getPaginatedStudents(): Student[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredStudents.slice(startIndex, endIndex);
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

        const headers = ['studentId', 'firstName', 'lastName', 'middleInitial', 'suffix', 'email', 'phoneNumber', 'password', 'course', 'yearLevel', 'section', 'status'];
        
        // Validate CSV headers (case-insensitive) - password is now optional for security
        const firstLine = lines[0].toLowerCase();
        const requiredHeaders = ['firstname', 'lastname', 'email', 'course', 'yearlevel'];
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

        this.csvValidationResults = this.csvService.validateStudentData(this.csvData);
        this.csvImportStep = 'validate';
        
        if (this.csvValidationResults.valid.length === 0 && this.csvValidationResults.invalid.length > 0) {
          this.toastService.warning('No valid students found in CSV file. Please check the validation errors.');
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

  importValidStudents(): void {
    if (this.csvValidationResults.valid.length === 0) {
      this.toastService.error('No valid students to import');
      return;
    }

    this.isSubmitting = true;
    this.csvImportProgress = 0;
    const validStudents = this.csvValidationResults.valid;
    let importedCount = 0;
    let errorCount = 0;

    // Import students one by one with progress tracking
    const importNext = (index: number) => {
      if (index >= validStudents.length) {
        this.isSubmitting = false;
        this.toastService.success(`Import completed! ${importedCount} students imported successfully.`);
        if (errorCount > 0) {
          this.toastService.warning(`${errorCount} students failed to import.`);
        }
        this.closeImportCsvModal();
        this.loadStudents(); // Refresh the list
        return;
      }

      const student = validStudents[index];
      this.csvImportProgress = Math.round(((index + 1) / validStudents.length) * 100);

      this.apiService.post('/auth/register-student', student).subscribe({
        next: (response: any) => {
          if (response.success) {
            importedCount++;
          } else {
            errorCount++;
          }
          importNext(index + 1);
        },
        error: (error) => {
          console.error('Error importing student:', error);
          errorCount++;
          importNext(index + 1);
        }
      });
    };

    importNext(0);
  }

  exportToCsv(): void {
    if (this.students.length === 0) {
      this.toastService.warning('No students to export');
      return;
    }

    const headers = ['studentId', 'firstName', 'lastName', 'middleInitial', 'suffix', 'email', 'phoneNumber', 'course', 'yearLevel', 'section', 'enrollmentStatus', 'accountStatus', 'createdAt'];
    const exportData = this.students.map(student => ({
      studentId: student.StudentID,
      firstName: student.FirstName,
      lastName: student.LastName,
      middleInitial: student.MiddleInitial || '',
      suffix: student.Suffix || '',
      email: student.Email,
      phoneNumber: student.PhoneNumber || '',
      course: student.Course,
      yearLevel: student.YearLevel,
      section: student.Section || '',
      enrollmentStatus: student.EnrollmentStatus,
      accountStatus: student.AccountStatus,
      createdAt: student.CreatedAt
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    this.csvService.generateCsv(exportData, headers, `students_export_${timestamp}.csv`);
    this.toastService.success('Students exported successfully!');
  }

  downloadStudentTemplate(): void {
    this.csvService.generateStudentTemplate();
    this.toastService.info('Student CSV template downloaded!');
  }

  

}
