import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

interface Student {
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: string;
  section: string;
  email: string;
  phoneNumber?: string;
  status: string;
}

export interface DetailedStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  fullName: string;
  course: string;
  yearLevel: string;
  section: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  enrollmentStatus: string;
  accountStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentAuthService {
  private currentStudentSubject = new BehaviorSubject<Student | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentStudent$ = this.currentStudentSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {
    console.log('🔧 StudentAuthService initializing...');

    // Initialize as not authenticated by default
    this.isAuthenticatedSubject.next(false);
    this.currentStudentSubject.next(null);

    // Then check for stored authentication
    this.initializeAuthenticationState();
  }

  /**
   * Initialize authentication state on app startup
   */
  private initializeAuthenticationState(): void {
    console.log('🔍 Initializing authentication state...');

    // Check for stored authentication data
    const storedStudent = localStorage.getItem('currentStudent');
    const storedToken = localStorage.getItem('studentToken');
    const loginTimestamp = localStorage.getItem('studentLoginTimestamp');

    console.log('📋 Stored data check:');
    console.log('   Student data:', !!storedStudent);
    console.log('   Token:', !!storedToken);
    console.log('   Timestamp:', !!loginTimestamp);

    if (!storedStudent || !storedToken || !loginTimestamp) {
      console.log('❌ No complete authentication data found');
      this.clearStoredAuth();
      return;
    }

    try {
      // Parse and validate stored data
      const student = JSON.parse(storedStudent);
      const timestamp = parseInt(loginTimestamp);
      const now = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

      // Check if session is expired
      if (now - timestamp >= sessionDuration) {
        console.log('❌ Stored session expired, clearing data');
        this.clearStoredAuth();
        return;
      }

      // If data is valid, restore authentication state
      console.log('✅ Restoring authentication state for:', student.fullName);
      this.currentStudentSubject.next(student);
      this.isAuthenticatedSubject.next(true);

    } catch (error) {
      console.error('❌ Error parsing stored authentication data:', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Force refresh authentication state from localStorage
   */
  refreshAuthState(): void {
    console.log('🔄 Forcing student authentication state refresh...');
    this.initializeAuthenticationState();
  }

  /**
   * Check if authentication is properly initialized and valid
   */
  isAuthenticationValid(): boolean {
    const isAuth = this.isAuthenticated();
    const student = this.getCurrentStudent();
    const token = this.getToken();

    console.log('🔍 Authentication validity check:');
    console.log('   Authenticated:', isAuth);
    console.log('   Has student:', !!student);
    console.log('   Has token:', !!token);

    return isAuth && !!student && !!token;
  }

  /**
   * Clear session and force logout
   */
  clearSession(): void {
    console.log('🧹 Manually clearing student session...');
    this.logout();
  }

  /**
   * Student login method
   */
  studentLogin(studentId: string, password: string): Observable<boolean> {
    console.log('🚀 Starting student login for:', studentId);
    console.log('🔍 Current auth state before login:', this.isAuthenticated());
    console.log('👤 Current student before login:', this.getCurrentStudent());

    return this.apiService.login({ studentId, password }).pipe(
      tap((response: any) => {
        console.log('🔍 Raw API Response:', response);
      }),
      map((response: any) => {
        console.log('🔍 Processing API Response:', response);

        if (response && response.success && response.data) {
          const student: Student = {
            studentId: response.data.StudentID,
            fullName: response.data.fullName,
            course: response.data.Course,
            yearLevel: response.data.YearLevel,
            section: response.data.Section,
            email: response.data.Email,
            phoneNumber: response.data.PhoneNumber,
            status: response.data.Status
          };

          console.log('✅ Student data processed:', student);

          // Store in localStorage first (this is synchronous)
          localStorage.setItem('currentStudent', JSON.stringify(student));
          // Store the actual JWT token from the backend response
          if (response.token) {
            localStorage.setItem('studentToken', response.token);
            console.log('🔑 JWT token stored:', response.token.substring(0, 20) + '...');
          } else {
            console.warn('⚠️ No token received from backend, using fallback');
            localStorage.setItem('studentToken', 'student-token-' + Date.now());
          }
          localStorage.setItem('studentLoginTimestamp', Date.now().toString());

          // Then update the subjects (this triggers observables)
          this.currentStudentSubject.next(student);
          this.isAuthenticatedSubject.next(true);

          console.log('✅ Student login successful, authentication state updated');
          console.log('🔐 Current auth state:', this.isAuthenticated());
          console.log('👤 Current student:', this.getCurrentStudent());
          console.log('💾 LocalStorage student:', localStorage.getItem('currentStudent'));
          console.log('💾 LocalStorage token:', localStorage.getItem('studentToken'));

          return true;
        } else {
          console.error('❌ Student login failed - invalid response structure');
          console.error('Response:', response);
          return false;
        }
      }),
      catchError((error) => {
        console.error('❌ Student login error:', error);
        return of(false);
      })
    );
  }

  /**
   * Get current student
   */
  getCurrentStudent(): Student | null {
    return this.currentStudentSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('studentToken');
  }

  /**
   * Comprehensive logout method - industry standard
   */
  logout(): void {
    console.log('🚪 Student logging out...');

    // Get token before clearing for backend invalidation
    const token = this.getToken();

    // 1. Clear all authentication state immediately
    this.currentStudentSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // 2. Clear all localStorage data
    this.clearStoredAuth();

    // 3. Clear any session storage data
    sessionStorage.removeItem('currentStudent');
    sessionStorage.removeItem('studentToken');
    sessionStorage.removeItem('studentLoginTimestamp');

    // 4. Clear any other student-related data
    localStorage.removeItem('studentPreferences');
    localStorage.removeItem('studentDashboardSettings');
    localStorage.removeItem('studentLastActivity');

    // 5. Force garbage collection of sensitive data
    this.clearSensitiveData();

    // 6. Optionally invalidate token on backend (fire and forget)
    if (token) {
      this.invalidateTokenOnBackend(token);
    }

    console.log('✅ Complete student logout finished - all data cleared');
  }

  /**
   * Invalidate token on backend (optional - fire and forget)
   */
  private invalidateTokenOnBackend(token: string): void {
    // This is optional and runs in background
    // Don't wait for response as user is already logged out locally
    this.apiService.post('/auth/logout', { token }).subscribe({
      next: () => console.log('🔒 Token invalidated on backend'),
      error: () => console.log('⚠️ Backend token invalidation failed (non-critical)')
    });
  }

  /**
   * Clear sensitive data from memory
   */
  private clearSensitiveData(): void {
    // Force clear any cached data
    if ((window as any).studentCache) {
      delete (window as any).studentCache;
    }

    // Clear any form data that might contain sensitive info
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.id.includes('student') || form.id.includes('login')) {
        form.reset();
      }
    });
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentLoginTimestamp');
  }

  /**
   * Validate student session with backend
   */
  validateSession(): Observable<boolean> {
    const student = this.getCurrentStudent();
    const token = this.getToken();
    const loginTimestamp = localStorage.getItem('studentLoginTimestamp');

    if (!student || !token || !loginTimestamp) {
      console.log('❌ Session validation failed: Missing required data');
      this.logout();
      return of(false);
    }

    // First check local timestamp for basic validation
    try {
      const timestamp = parseInt(loginTimestamp);
      const now = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (now - timestamp >= sessionDuration) {
        console.log('❌ Session validation failed: Local session expired');
        this.logout();
        return of(false);
      }
    } catch (error) {
      console.error('❌ Session validation failed: Error parsing timestamp', error);
      this.logout();
      return of(false);
    }

    // If local validation passes, validate with backend
    console.log('🔍 Validating session with backend...');
    return this.apiService.validateStudentSession(token).pipe(
      map((response: any) => {
        if (response && response.success && response.data) {
          console.log('✅ Backend session validation successful');

          // Update stored student data with fresh data from backend
          const updatedStudent: Student = {
            studentId: response.data.StudentID,
            fullName: response.data.fullName,
            course: response.data.Course,
            yearLevel: response.data.YearLevel,
            section: response.data.Section,
            email: response.data.Email,
            phoneNumber: response.data.PhoneNumber,
            status: response.data.AccountStatus
          };

          localStorage.setItem('currentStudent', JSON.stringify(updatedStudent));
          this.currentStudentSubject.next(updatedStudent);

          return true;
        } else {
          console.log('❌ Backend session validation failed');
          this.logout();
          return false;
        }
      }),
      catchError((error) => {
        console.error('❌ Session validation error:', error);
        this.logout();
        return of(false);
      })
    );
  }

  /**
   * Update student profile
   */
  updateProfile(updates: Partial<Student>): Observable<boolean> {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) {
      return of(false);
    }

    const updatedStudent = { ...currentStudent, ...updates };
    
    // Update localStorage
    localStorage.setItem('currentStudent', JSON.stringify(updatedStudent));
    
    // Update subject
    this.currentStudentSubject.next(updatedStudent);
    
    console.log('✅ Student profile updated:', updatedStudent);
    return of(true);
  }

  /**
   * Check if student has specific permissions
   */
  hasPermission(permission: string): boolean {
    const student = this.getCurrentStudent();
    if (!student) return false;

    // Students have basic permissions by default
    const studentPermissions = [
      'view_books',
      'borrow_books',
      'view_loans',
      'renew_books',
      'make_reservations',
      'view_profile',
      'update_profile'
    ];

    return studentPermissions.includes(permission);
  }

  /**
   * Get detailed student profile information
   */
  getDetailedProfile(): Observable<DetailedStudent | null> {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) {
      return of(null);
    }

    // Call the backend API to get detailed student information
    return this.apiService.get(`/auth/get-student/${currentStudent.studentId}`).pipe(
      map((response: any) => {
        console.log('🔍 Raw API response for getDetailedProfile:', response);

        if (response && response.success && response.data) {
          const data = response.data;
          console.log('🔍 Raw data.ProfilePhoto:', data.ProfilePhoto);
          console.log('🔍 ProfilePhoto type:', typeof data.ProfilePhoto);

          const detailedStudent = {
            studentId: data.StudentID,
            firstName: data.FirstName,
            lastName: data.LastName,
            middleInitial: data.MiddleInitial || '',
            suffix: data.Suffix || '',
            fullName: data.fullName || `${data.FirstName} ${data.LastName}`.trim(),
            course: data.Course,
            yearLevel: data.YearLevel,
            section: data.Section,
            email: data.Email,
            phoneNumber: data.PhoneNumber || '',
            profilePhoto: data.ProfilePhoto || null,
            enrollmentStatus: data.EnrollmentStatus,
            accountStatus: data.AccountStatus,
            createdAt: data.CreatedAt,
            updatedAt: data.UpdatedAt
          } as DetailedStudent;

          console.log('🔍 Processed detailedStudent.profilePhoto:', detailedStudent.profilePhoto);
          return detailedStudent;
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error fetching detailed student profile:', error);
        return of(null);
      })
    );
  }

  /**
   * Update detailed student profile
   */
  updateDetailedProfile(updates: Partial<DetailedStudent>): Observable<boolean> {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) {
      return of(false);
    }

    // Prepare the update data for the backend API
    const updateData = {
      firstName: updates.firstName,
      lastName: updates.lastName,
      middleInitial: updates.middleInitial,
      suffix: updates.suffix,
      course: updates.course,
      yearLevel: updates.yearLevel,
      section: updates.section,
      email: updates.email,
      phoneNumber: updates.phoneNumber
    };

    // Call the backend API to update student information
    return this.apiService.put(`/auth/update-student/${currentStudent.studentId}`, updateData).pipe(
      map((response: any) => {
        if (response && response.success) {
          // Update the current student data in localStorage
          const updatedStudent = {
            ...currentStudent,
            fullName: `${updates.firstName} ${updates.lastName}`.trim(),
            email: updates.email || currentStudent.email,
            phoneNumber: updates.phoneNumber || currentStudent.phoneNumber,
            course: updates.course || currentStudent.course,
            yearLevel: updates.yearLevel || currentStudent.yearLevel,
            section: updates.section || currentStudent.section
          };

          localStorage.setItem('currentStudent', JSON.stringify(updatedStudent));
          this.currentStudentSubject.next(updatedStudent);

          console.log('✅ Student profile updated successfully:', updatedStudent);
          return true;
        }
        return false;
      }),
      catchError((error) => {
        console.error('Error updating student profile:', error);
        return of(false);
      })
    );
  }

  /**
   * Upload student profile photo
   */
  uploadProfilePhoto(file: File): Observable<string | null> {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) {
      throw new Error('No student logged in');
    }

    return this.apiService.uploadProfilePhoto(currentStudent.studentId, file).pipe(
      map((response: any) => {
        console.log('Upload response:', response); // Debug log
        if (response && response.success && response.data && response.data.imageUrl) {
          const imageUrl = response.data.imageUrl;
          console.log('✅ Profile photo uploaded successfully:', imageUrl);
          return imageUrl;
        } else {
          console.error('Upload failed - invalid response:', response);
          throw new Error(response?.error || 'Failed to upload profile photo');
        }
      }),
      catchError((error) => {
        console.error('Error uploading profile photo:', error);
        throw error; // Re-throw the error instead of returning null
      })
    );
  }

  /**
   * Delete student profile photo
   */
  deleteProfilePhoto(): Observable<boolean> {
    const currentStudent = this.getCurrentStudent();
    if (!currentStudent) {
      return of(false);
    }

    return this.apiService.deleteProfilePhoto(currentStudent.studentId).pipe(
      map((response: any) => {
        if (response && response.success) {
          console.log('✅ Profile photo deleted successfully');
          return true;
        }
        return false;
      }),
      catchError((error) => {
        console.error('Error deleting profile photo:', error);
        return of(false);
      })
    );
  }

  /**
   * Get student dashboard stats
   */
  getDashboardStats(): Observable<any> {
    // Mock data - replace with actual API call
    return of({
      totalBooksLoaned: 3,
      overdueBooks: 1,
      availableRenewals: 5,
      libraryFines: 5,
      reservations: 2,
      favoriteBooks: 12
    });
  }
}
