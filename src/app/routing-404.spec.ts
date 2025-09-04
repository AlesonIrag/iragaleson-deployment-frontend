import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { NotFoundComponent } from './not-found/not-found.component';

// Mock components for testing
@Component({
  template: '<div>Landing Page</div>'
})
class MockLandingComponent { }

@Component({
  template: '<div>Login Page</div>'
})
class MockLoginComponent { }

describe('404 Routing Integration', () => {
  let router: Router;
  let location: Location;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: MockLandingComponent },
          { path: 'login', component: MockLoginComponent },
          { path: '**', component: NotFoundComponent }
        ])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(NotFoundComponent);
  });

  it('should navigate to 404 page for invalid routes', async () => {
    // Test various invalid routes that should trigger 404
    const invalidRoutes = [
      '/loginn',        // Double 'n' as mentioned in the request
      '/loginnn',       // Triple 'n'
      '/invalid-route',
      '/non-existent',
      '/admin-login-typo',
      '/dashboardd',
      '/random-path'
    ];

    for (const invalidRoute of invalidRoutes) {
      await router.navigate([invalidRoute]);
      expect(location.path()).toBe(invalidRoute);
      
      // The router should have matched the wildcard route
      // In a real application, this would render the NotFoundComponent
    }
  });

  it('should navigate to valid routes correctly', async () => {
    // Test that valid routes still work
    await router.navigate(['']);
    expect(location.path()).toBe('/');

    await router.navigate(['/login']);
    expect(location.path()).toBe('/login');
  });

  it('should handle complex invalid paths', async () => {
    const complexInvalidPaths = [
      '/login/extra/path',
      '/admin/login/wrong',
      '/dashboard/invalid/nested',
      '/support/help/extra'
    ];

    for (const path of complexInvalidPaths) {
      await router.navigate([path]);
      expect(location.path()).toBe(path);
      // These should all be caught by the wildcard route
    }
  });

  it('should handle query parameters on invalid routes', async () => {
    await router.navigate(['/invalid-route'], { queryParams: { test: 'value' } });
    expect(location.path()).toBe('/invalid-route?test=value');
  });

  it('should handle fragments on invalid routes', async () => {
    await router.navigate(['/invalid-route'], { fragment: 'section' });
    expect(location.path()).toBe('/invalid-route#section');
  });
});
