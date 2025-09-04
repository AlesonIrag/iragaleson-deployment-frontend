import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, catchError, take, timeout, switchMap, tap } from 'rxjs';
import { of } from 'rxjs';
import { StudentAuthService } from '../services/student-auth.service';

@Injectable({
  providedIn: 'root'
})
export class StudentGuard implements CanActivate {

  constructor(
    private studentAuthService: StudentAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('🔐 StudentGuard: Checking access to:', state.url);

    // Always return an Observable for consistent behavior
    return this.checkAuthentication(state.url);
  }

  private checkAuthentication(returnUrl: string): Observable<boolean> {
    console.log('🔍 Checking authentication state...');

    // First, check if we have any stored authentication data
    const storedStudent = localStorage.getItem('currentStudent');
    const storedToken = localStorage.getItem('studentToken');
    const loginTimestamp = localStorage.getItem('studentLoginTimestamp');

    console.log('📋 Stored auth data check:');
    console.log('   Student:', !!storedStudent);
    console.log('   Token:', !!storedToken);
    console.log('   Timestamp:', !!loginTimestamp);

    // If no stored data at all, immediately deny access
    if (!storedStudent || !storedToken || !loginTimestamp) {
      console.log('❌ No authentication data found - denying access');
      this.redirectToLogin(returnUrl);
      return of(false);
    }

    // Check if local session is expired
    try {
      const timestamp = parseInt(loginTimestamp);
      const now = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

      if (now - timestamp >= sessionDuration) {
        console.log('❌ Local session expired - clearing and denying access');
        this.studentAuthService.logout();
        this.redirectToLogin(returnUrl);
        return of(false);
      }
    } catch (error) {
      console.log('❌ Invalid timestamp - clearing and denying access');
      this.studentAuthService.logout();
      this.redirectToLogin(returnUrl);
      return of(false);
    }

    // If we have stored data and it's not expired, validate with backend
    console.log('🔍 Validating session with backend...');
    return this.studentAuthService.validateSession().pipe(
      timeout(5000), // 5 second timeout
      take(1),
      map((isValid: boolean) => {
        console.log('📊 Backend validation result:', isValid);

        if (isValid) {
          console.log('✅ Authentication valid - granting access');
          return true;
        } else {
          console.log('❌ Backend validation failed - denying access');
          this.studentAuthService.logout();
          this.redirectToLogin(returnUrl);
          return false;
        }
      }),
      catchError((error) => {
        console.error('❌ Backend validation error:', error);
        console.log('❌ Validation failed - denying access');
        this.studentAuthService.logout();
        this.redirectToLogin(returnUrl);
        return of(false);
      })
    );
  }

  private redirectToLogin(returnUrl: string): void {
    console.log('❌ Student access denied - redirecting to login');
    this.router.navigate(['/login'], {
      queryParams: { returnUrl }
    });
  }
}
