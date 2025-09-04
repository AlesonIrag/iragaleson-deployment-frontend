import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    console.log('🛡️ === ADMIN GUARD ACTIVATION ===');
    console.log('🎯 Requested URL:', state.url);
    console.log('🔐 Current auth state:', this.authService.isAuthenticated());
    console.log('👤 Current admin:', this.authService.getCurrentAdmin());
    console.log('💾 LocalStorage admin:', localStorage.getItem('currentAdmin'));
    console.log('💾 LocalStorage token:', localStorage.getItem('adminToken'));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('================================');

    // First check if we have immediate authentication
    const isAuthenticated = this.authService.isAuthenticated();
    const currentAdmin = this.authService.getCurrentAdmin();

    if (isAuthenticated && currentAdmin) {
      console.log(`✅ Immediate admin access granted for: ${currentAdmin.fullName} (${currentAdmin.role})`);
      return true;
    }

    // If not immediately authenticated, validate session
    return this.authService.validateSession().pipe(
      map((isValid: boolean) => {
        console.log('✅ Session validation result:', isValid);

        if (isValid && this.authService.isAuthenticated()) {
          const admin = this.authService.getCurrentAdmin();
          console.log('👤 Current admin from guard after validation:', admin);

          if (admin) {
            console.log(`✅ Admin access granted after validation for: ${admin.fullName} (${admin.role})`);
            return true;
          } else {
            console.log('❌ No current admin found after validation');
          }
        } else {
          console.log('❌ Session invalid or not authenticated');
        }

        console.log('❌ Admin access denied - redirecting to login');
        this.router.navigate(['/adminlogin'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }),
      catchError((error) => {
        console.error('❌ Admin guard error:', error);
        this.router.navigate(['/adminlogin'], {
          queryParams: { returnUrl: state.url }
        });
        return of(false);
      })
    );
  }
}
