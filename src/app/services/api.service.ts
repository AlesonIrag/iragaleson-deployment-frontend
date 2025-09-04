import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, timer, of } from 'rxjs';
import { catchError, retry, timeout, map, delay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  retryCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly backendUrl = environment.backendUrl;
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({
    isConnected: false,
    lastChecked: new Date(),
    retryCount: 0
  });

  private defaultHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {
    this.initializeConnectionMonitoring();
  }

  // Connection status observable
  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  // Health check endpoint
  checkHealth(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.backendUrl}${environment.endpoints.health}`, {
      headers: this.defaultHeaders
    }).pipe(
      timeout(environment.connectionRetry?.timeout || 5000),
      map((response: any) => {
        this.updateConnectionStatus(true, 0);
        return response;
      }),
      catchError(error => {
        this.updateConnectionStatus(false, this.connectionStatus$.value.retryCount + 1);
        return this.handleError(error);
      })
    );
  }

  // Generic GET request
  get<T>(endpoint: string, options?: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.get(url, {
      headers: this.defaultHeaders,
      ...options
    }).pipe(
      map((response: any) => response as ApiResponse<T>),
      timeout(environment.connectionRetry?.timeout || 10000),
      retry(environment.connectionRetry?.maxRetries || 2),
      catchError(this.handleError)
    );
  }

  // Generic POST request
  post<T>(endpoint: string, data: any, options?: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.post(url, data, {
      headers: this.defaultHeaders,
      ...options
    }).pipe(
      map((response: any) => response as ApiResponse<T>),
      timeout(environment.connectionRetry?.timeout || 10000),
      retry(environment.connectionRetry?.maxRetries || 2),
      catchError(this.handleError)
    );
  }

  // Generic PUT request
  put<T>(endpoint: string, data: any, options?: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.put(url, data, {
      headers: this.defaultHeaders,
      ...options
    }).pipe(
      map((response: any) => response as ApiResponse<T>),
      timeout(environment.connectionRetry?.timeout || 10000),
      retry(environment.connectionRetry?.maxRetries || 2),
      catchError(this.handleError)
    );
  }

  // Generic DELETE request
  delete<T>(endpoint: string, options?: any): Observable<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.http.delete(url, {
      headers: this.defaultHeaders,
      ...options
    }).pipe(
      map((response: any) => response as ApiResponse<T>),
      timeout(environment.connectionRetry?.timeout || 10000),
      retry(environment.connectionRetry?.maxRetries || 2),
      catchError(this.handleError)
    );
  }

  // Authentication endpoints
  login(credentials: { studentId: string; password: string }): Observable<ApiResponse> {
    return this.post(environment.endpoints.auth + '/login', credentials);
  }

  // Student session validation
  validateStudentSession(token: string): Observable<ApiResponse> {
    return this.post(environment.endpoints.auth + '/validate-session', { token });
  }

  // Faculty session validation
  validateFacultySession(token: string): Observable<ApiResponse> {
    return this.post(environment.endpoints.facultyAuth + '/validate-session', { token });
  }

  // Admin session validation
  validateAdminSession(token: string): Observable<ApiResponse> {
    return this.post(environment.endpoints.adminAuth + '/validate-session', { token });
  }

  // Admin authentication endpoints
  adminLogin(credentials: { email: string; password: string }): Observable<ApiResponse> {
    return this.post(environment.endpoints.adminAuth + '/login-admin', credentials);
  }

  facultyLogin(credentials: { facultyId: string; password: string }): Observable<ApiResponse> {
    console.log('🔐 API Service: Faculty login request for:', credentials.facultyId);

    // Temporary mock response for testing (remove when backend is working)
    if (credentials.facultyId === '2022-000001' && credentials.password === 'FacultyPass123') {
      console.log('✅ Mock faculty login successful');
      return of({
        success: true,
        data: {
          FacultyID: 2022000001,
          FullName: 'Dr. John Smith',
          Department: 'Computer Science',
          Position: 'Professor',
          Email: 'john.smith@benedictocollege.edu.ph',
          PhoneNumber: '09123456789',
          Status: 'Active',
          Specialization: 'Database Systems',
          FormattedFacultyID: '2022-000001'
        },
        message: 'Faculty login successful'
      } as ApiResponse).pipe(delay(1000)); // Simulate network delay
    }

    // Try real backend first, fallback to mock on error
    return this.post(environment.endpoints.facultyAuth + '/login-faculty', credentials).pipe(
      catchError(error => {
        console.warn('⚠️ Backend not available, using mock response for invalid credentials');
        console.error('Backend error:', error);

        // Return mock error for invalid credentials
        return of({
          success: false,
          message: 'Invalid faculty credentials',
          data: null
        } as ApiResponse).pipe(delay(1000));
      })
    );
  }

  // Weather endpoints
  getWeather(): Observable<ApiResponse> {
    return this.get(environment.endpoints.weather);
  }

  // Password Reset endpoints
  requestOTP(email: string, userType: string): Observable<ApiResponse> {
    return this.post('/password-reset/request-otp', { email, userType });
  }

  verifyOTP(email: string, userType: string, otp: string): Observable<ApiResponse> {
    return this.post('/password-reset/verify-otp', { email, userType, otp });
  }

  resetPassword(resetToken: string, newPassword: string, confirmPassword: string): Observable<ApiResponse> {
    return this.post('/password-reset/reset-password', { resetToken, newPassword, confirmPassword });
  }

  // File upload endpoints
  uploadProfilePhoto(studentId: string, file: File): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/uploads/profile-photo/${studentId}`,
      formData,
      {
        headers: {
          // Don't set Content-Type header, let browser set it with boundary for FormData
        }
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteProfilePhoto(studentId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/uploads/profile-photo/${studentId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Admin profile photo upload endpoints
  uploadAdminProfilePhoto(adminId: string, file: File): Observable<ApiResponse> {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    return this.http.post<ApiResponse>(
      `${this.baseUrl}/uploads/admin-profile-photo/${adminId}`,
      formData,
      {
        headers: {
          // Don't set Content-Type header, let browser set it with boundary for FormData
        }
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteAdminProfilePhoto(adminId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/uploads/admin-profile-photo/${adminId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Faculty profile photo upload endpoints
  uploadFacultyProfilePhoto(facultyId: string, file: File): Observable<ApiResponse> {
    console.log('🚀 API Service: uploadFacultyProfilePhoto called');
    console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
    console.log('👤 Faculty ID:', facultyId);

    const formData = new FormData();
    formData.append('profilePhoto', file);

    const url = `${this.baseUrl}/uploads/profile-photo/${facultyId}`;
    console.log('🌐 Upload URL:', url);

    return this.http.post<ApiResponse>(
      url,
      formData,
      {
        headers: {
          // Don't set Content-Type header, let browser set it with boundary for FormData
        }
      }
    ).pipe(
      tap((response: ApiResponse) => {
        console.log('✅ API Service: Upload response received:', response);
      }),
      catchError((error) => {
        console.error('❌ API Service: Upload error:', error);
        return this.handleError(error);
      })
    );
  }

  deleteFacultyProfilePhoto(facultyId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(
      `${this.baseUrl}/uploads/faculty-profile-photo/${facultyId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Admin profile management endpoints
  getAdminProfile(adminId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `${this.baseUrl}/adminauth/profile/${adminId}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateAdminProfile(adminId: string, profileData: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.baseUrl}/adminauth/profile/${adminId}`,
      profileData
    ).pipe(
      catchError(this.handleError)
    );
  }

  getProfilePhotoUrl(filename: string): string {
    return `${this.baseUrl}/uploads/profile-photos/${filename}`;
  }

  getWeatherForecast(): Observable<ApiResponse> {
    return this.get(environment.endpoints.weather + '/forecast');
  }

  // Admin Management endpoints
  getAllAdmins(page?: number, limit?: number): Observable<ApiResponse> {
    let endpoint = environment.endpoints.adminAuth + '/get-all-admins';
    
    // Build query string manually to ensure parameters are sent correctly
    const queryParams: string[] = [];
    if (page) queryParams.push(`page=${page}`);
    if (limit) queryParams.push(`limit=${limit}`);
    
    if (queryParams.length > 0) {
      endpoint += '?' + queryParams.join('&');
    }
    
    console.log('🌐 API Service: getAllAdmins endpoint:', endpoint);
    
    return this.get(endpoint);
  }

  getAdminById(adminId: string): Observable<ApiResponse> {
    return this.get(environment.endpoints.adminAuth + `/get-admin/${adminId}`);
  }

  getAdminsByRole(role: string): Observable<ApiResponse> {
    return this.get(environment.endpoints.adminAuth + `/get-admins-by-role/${encodeURIComponent(role)}`);
  }

  createAdmin(adminData: any): Observable<ApiResponse> {
    return this.post(environment.endpoints.adminAuth + '/register-admin', adminData);
  }

  updateAdmin(adminId: string, adminData: any): Observable<ApiResponse> {
    return this.put(environment.endpoints.adminAuth + `/update-admin/${adminId}`, adminData);
  }

  deleteAdmin(adminId: string): Observable<ApiResponse> {
    return this.delete(environment.endpoints.adminAuth + `/delete-admin/${adminId}`);
  }

  changeAdminPassword(adminId: string, passwordData: any): Observable<ApiResponse> {
    return this.post(environment.endpoints.adminAuth + `/change-admin-password/${adminId}`, passwordData);
  }

  getAdminAuditLogs(adminId?: string, limit?: number, offset?: number): Observable<ApiResponse> {
    let endpoint = environment.endpoints.adminAuth + '/admin-audit-logs';

    if (adminId) {
      endpoint += `/${adminId}`;
    }

    const params: any = {};
    if (limit) params.limit = limit.toString();
    if (offset) params.offset = offset.toString();

    return this.get(endpoint, { params });
  }

  // Faculty Management endpoints
  getAllFaculty(): Observable<ApiResponse> {
    return this.get(environment.endpoints.facultyAuth + '/get-all-faculty');
  }

  getFacultyById(facultyId: string): Observable<ApiResponse> {
    return this.get(environment.endpoints.facultyAuth + `/get-faculty/${facultyId}`);
  }

  getFacultyByDepartment(department: string): Observable<ApiResponse> {
    return this.get(environment.endpoints.facultyAuth + `/get-faculty-by-department/${encodeURIComponent(department)}`);
  }

  getFacultyByPosition(position: string): Observable<ApiResponse> {
    return this.get(environment.endpoints.facultyAuth + `/get-faculty-by-position/${encodeURIComponent(position)}`);
  }

  createFaculty(facultyData: any): Observable<ApiResponse> {
    return this.post(environment.endpoints.facultyAuth + '/register-faculty', facultyData);
  }

  updateFaculty(facultyId: string, facultyData: any): Observable<ApiResponse> {
    return this.put(environment.endpoints.facultyAuth + `/update-faculty/${facultyId}`, facultyData);
  }

  deleteFaculty(facultyId: string): Observable<ApiResponse> {
    return this.delete(environment.endpoints.facultyAuth + `/delete-faculty/${facultyId}`);
  }

  changeFacultyPassword(facultyId: string, passwordData: any): Observable<ApiResponse> {
    return this.post(environment.endpoints.facultyAuth + `/change-faculty-password/${facultyId}`, passwordData);
  }

  getFacultyAuditLogs(facultyId?: string, limit?: number, offset?: number): Observable<ApiResponse> {
    let endpoint = environment.endpoints.facultyAuth + '/faculty-audit-logs';

    if (facultyId) {
      endpoint += `/${facultyId}`;
    }

    const params: any = {};
    if (limit) params.limit = limit.toString();
    if (offset) params.offset = offset.toString();

    return this.get(endpoint, { params });
  }

  // Private methods
  private initializeConnectionMonitoring(): void {
    // Check connection every 30 seconds
    timer(0, 30000).subscribe(() => {
      this.checkHealth().subscribe();
    });
  }

  private updateConnectionStatus(isConnected: boolean, retryCount: number): void {
    this.connectionStatus$.next({
      isConnected,
      lastChecked: new Date(),
      retryCount
    });
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Backend server is not reachable. Please ensure the backend is running.';
          break;
        case 400:
          errorMessage = 'Bad Request: ' + (error.error?.error || error.error?.message || 'Invalid request data');
          break;
        case 401:
          errorMessage = 'Unauthorized: ' + (error.error?.message || 'Authentication required');
          break;
        case 403:
          errorMessage = 'Forbidden: ' + (error.error?.message || 'Access denied');
          break;
        case 404:
          errorMessage = 'Not Found: ' + (error.error?.message || 'Resource not found');
          break;
        case 500:
          errorMessage = 'Internal Server Error: ' + (error.error?.message || 'Server error');
          break;
        default:
          errorMessage = `Server Error (${error.status}): ${error.error?.message || error.message}`;
      }
    }

    if (environment.enableLogging) {
      console.error('API Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url,
        timestamp: new Date().toISOString()
      });
    }

    return throwError(() => ({
      success: false,
      error: errorMessage,
      details: error.error?.details || null,
      status: error.status
    }));
  };
}
