import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

export interface AdminUser {
  adminId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  phoneNumber?: string;
  profilePhoto?: string;
}

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    admin: AdminUser;
    token?: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentAdminSubject = new BehaviorSubject<AdminUser | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentAdmin$ = this.currentAdminSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Check if admin is already logged in on service initialization
    this.checkStoredAuth();
  }

  /**
   * Check if there's stored authentication data
   */
  private checkStoredAuth(): void {
    const storedAdmin = localStorage.getItem('currentAdmin');
    const storedToken = localStorage.getItem('adminToken');

    if (storedAdmin && storedToken) {
      try {
        const admin = JSON.parse(storedAdmin);
        this.currentAdminSubject.next(admin);
        this.isAuthenticatedSubject.next(true);
        console.log('🔄 Restored authentication from localStorage:', admin.fullName);
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        this.clearStoredAuth();
      }
    }
  }

  /**
   * Force refresh authentication state from localStorage
   */
  refreshAuthState(): void {
    console.log('🔄 Forcing authentication state refresh...');
    this.checkStoredAuth();
  }

  /**
   * Admin login method
   */
  adminLogin(email: string, password: string): Observable<boolean> {
    console.log('🚀 Starting admin login for:', email);
    console.log('🔍 Current auth state before login:', this.isAuthenticated());
    console.log('👤 Current admin before login:', this.getCurrentAdmin());

    return this.apiService.adminLogin({ email, password }).pipe(
      tap((response: any) => {
        console.log('🔍 Raw API Response:', response);
      }),
      map((response: any) => {
        console.log('🔍 Processing API Response:', response);

        if (response && response.success && response.data) {
          const adminData = response.data;
          console.log('📋 Admin data from API:', adminData);

          // Map backend admin data to our AdminUser interface
          const admin: AdminUser = {
            adminId: adminData.AdminID,
            fullName: adminData.FullName,
            email: adminData.Email,
            role: adminData.Role,
            status: adminData.Status,
            profilePhoto: adminData.ProfilePhoto || ''
          };

          console.log('👤 Mapped admin object:', admin);

          // Store in localStorage first for immediate persistence
          localStorage.setItem('currentAdmin', JSON.stringify(admin));
          if (response.token) {
            localStorage.setItem('adminToken', response.token);
          }

          // Then update the subjects (this triggers observables)
          this.currentAdminSubject.next(admin);
          this.isAuthenticatedSubject.next(true);

          console.log('✅ Admin login successful, authentication state updated');
          console.log('🔐 Current auth state:', this.isAuthenticated());
          console.log('👤 Current admin:', this.getCurrentAdmin());
          console.log('💾 LocalStorage admin:', localStorage.getItem('currentAdmin'));
          console.log('💾 LocalStorage token:', localStorage.getItem('adminToken'));

          return true;
        } else {
          console.error('❌ Admin login failed - invalid response structure');
          console.error('Response:', response);
          return false;
        }
      }),
      catchError((error) => {
        console.error('❌ Admin login error:', error);
        return of(false);
      })
    );
  }

  /**
   * Logout method
   */
  logout(): void {
    console.log('🚪 === LOGOUT PROCESS STARTED ===');
    console.log('🔐 Auth state before logout:', this.isAuthenticated());
    console.log('👤 Current admin before logout:', this.getCurrentAdmin());

    // Clear the subjects first
    this.currentAdminSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Clear localStorage
    this.clearStoredAuth();

    console.log('🔐 Auth state after logout:', this.isAuthenticated());
    console.log('👤 Current admin after logout:', this.getCurrentAdmin());
    console.log('💾 LocalStorage after logout - Admin:', localStorage.getItem('currentAdmin'));
    console.log('💾 LocalStorage after logout - Token:', localStorage.getItem('adminToken'));
    console.log('✅ Admin logged out successfully');
    console.log('================================');
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('adminToken');
  }

  /**
   * Force clear all authentication data (public method for debugging)
   */
  forceClearAuth(): void {
    console.log('🧹 Force clearing all authentication data...');
    this.currentAdminSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.clearStoredAuth();
    console.log('✅ All authentication data cleared');
  }

  /**
   * Get current admin user
   */
  getCurrentAdmin(): AdminUser | null {
    return this.currentAdminSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get admin token
   */
  getToken(): string | null {
    return localStorage.getItem('adminToken');
  }

  /**
   * Check if admin has specific role
   */
  hasRole(role: string): boolean {
    const currentAdmin = this.getCurrentAdmin();
    return currentAdmin ? currentAdmin.role === role : false;
  }

  /**
   * Check if admin has minimum role level
   */
  hasMinimumRole(requiredRole: string): boolean {
    const roleHierarchy: { [key: string]: number } = {
      'Librarian Staff': 1,
      'Librarian': 2,
      'Data Center Admin': 3,
      'Super Admin': 4
    };

    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) return false;

    const currentRoleLevel = roleHierarchy[currentAdmin.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return currentRoleLevel >= requiredRoleLevel;
  }

  /**
   * Validate admin session with backend JWT verification
   */
  validateSession(): Observable<boolean> {
    const admin = this.getCurrentAdmin();
    const token = this.getToken();

    if (!admin || !token) {
      this.logout();
      return of(false);
    }

    // Validate with backend
    return this.apiService.post('/adminauth/validate-session', { token }).pipe(
      map((response: any) => {
        if (response && response.success) {
          console.log('✅ Admin session validation successful');
          return true;
        } else {
          console.log('❌ Admin session validation failed');
          this.logout();
          return false;
        }
      }),
      catchError((error) => {
        console.error('❌ Admin session validation error:', error);
        this.logout();
        return of(false);
      })
    );
  }

  /**
   * Update admin profile information
   */
  updateProfile(profileData: ProfileUpdateData): Observable<boolean> {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) {
      return of(false);
    }

    // Send update to backend
    const updateData = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phoneNumber: profileData.phoneNumber,
      profilePhoto: profileData.profilePhoto
    };

    return this.apiService.updateAdminProfile(currentAdmin.adminId.toString(), updateData).pipe(
      map((response: any) => {
        if (response && response.success) {
          // Update localStorage with new data
          const updatedAdmin: AdminUser = {
            ...currentAdmin,
            fullName: `${profileData.firstName} ${profileData.lastName}`.trim(),
            email: profileData.email,
            phoneNumber: profileData.phoneNumber,
            profilePhoto: profileData.profilePhoto
          };

          localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
          this.currentAdminSubject.next(updatedAdmin);
          console.log('✅ Admin profile updated:', updatedAdmin);
          return true;
        }
        return false;
      }),
      catchError((error) => {
        console.error('Error updating admin profile:', error);
        return of(false);
      })
    );
  }

  /**
   * Get admin profile with additional details
   */
  getProfileDetails(): Observable<AdminUser | null> {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) {
      return of(null);
    }

    // Fetch fresh data from backend
    return this.apiService.getAdminProfile(currentAdmin.adminId.toString()).pipe(
      map((response: any) => {
        if (response && response.success && response.data) {
          const adminData = response.data;
          const updatedAdmin: AdminUser = {
            adminId: adminData.AdminID,
            fullName: adminData.FullName || `${adminData.FirstName} ${adminData.LastName}`.trim(),
            email: adminData.Email,
            role: adminData.Role,
            status: adminData.Status,
            phoneNumber: adminData.PhoneNumber || '',
            profilePhoto: adminData.ProfilePhoto || this.getDefaultProfilePhoto(adminData.FirstName || 'A')
          };

          // Update localStorage with fresh data
          localStorage.setItem('currentAdmin', JSON.stringify(updatedAdmin));
          return updatedAdmin;
        }
        return currentAdmin; // Fallback to cached data
      }),
      catchError((error) => {
        console.error('Error fetching admin profile:', error);
        return of(currentAdmin); // Fallback to cached data on error
      })
    );
  }

  private getDefaultProfilePhoto(firstName: string): string {
    const initial = firstName.charAt(0).toUpperCase() || 'A';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%233B82F6'/%3E%3Ctext x='60' y='75' text-anchor='middle' fill='white' font-family='Arial' font-size='48' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  }

  /**
   * Upload profile photo
   */
  uploadProfilePhoto(file: File): Observable<string | null> {
    const currentAdmin = this.getCurrentAdmin();
    if (!currentAdmin) {
      throw new Error('No admin logged in');
    }

    return this.apiService.uploadAdminProfilePhoto(currentAdmin.adminId.toString(), file).pipe(
      map((response: any) => {
        if (response && response.success && response.data && response.data.imageUrl) {
          return response.data.imageUrl;
        } else {
          throw new Error(response?.error || 'Failed to upload profile photo');
        }
      })
    );
  }
}
