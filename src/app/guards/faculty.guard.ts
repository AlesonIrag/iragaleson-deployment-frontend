import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { FacultyAuthService } from '../services/faculty-auth.service';

@Injectable({
  providedIn: 'root'
})
export class FacultyGuard implements CanActivate {

  constructor(
    private facultyAuthService: FacultyAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('🔐 FacultyGuard: Checking faculty access...');
    console.log('🔍 Current faculty auth state:', this.facultyAuthService.isAuthenticated());
    console.log('👤 Current faculty:', this.facultyAuthService.getCurrentFaculty());

    // Check if already authenticated
    if (this.facultyAuthService.isAuthenticated()) {
      const faculty = this.facultyAuthService.getCurrentFaculty();
      console.log('👤 Current faculty from guard:', faculty);
      
      if (faculty) {
        console.log(`✅ Faculty access granted for: ${faculty.fullName} (${faculty.facultyId})`);
        return true;
      } else {
        console.log('❌ No current faculty found despite authentication');
      }
    }

    // If not immediately authenticated, validate session
    return this.facultyAuthService.validateSession().pipe(
      map((isValid: boolean) => {
        console.log('✅ Faculty session validation result:', isValid);

        if (isValid && this.facultyAuthService.isAuthenticated()) {
          const faculty = this.facultyAuthService.getCurrentFaculty();
          console.log('👤 Current faculty from guard after validation:', faculty);

          if (faculty) {
            console.log(`✅ Faculty access granted after validation for: ${faculty.fullName} (${faculty.facultyId})`);
            return true;
          } else {
            console.log('❌ No current faculty found after validation');
          }
        } else {
          console.log('❌ Faculty session invalid or not authenticated');
        }

        console.log('❌ Faculty access denied - redirecting to login');
        this.router.navigate(['/facultylogin'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}
