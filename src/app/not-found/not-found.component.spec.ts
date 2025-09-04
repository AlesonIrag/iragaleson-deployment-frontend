import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { NotFoundComponent } from './not-found.component';

// Mock component for testing routing
@Component({
  template: '<div>Home Page</div>'
})
class MockHomeComponent { }

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotFoundComponent,
        RouterTestingModule.withRoutes([
          { path: '', component: MockHomeComponent },
          { path: '**', component: NotFoundComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display 404 error message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('404');
    expect(compiled.querySelector('h2')?.textContent).toContain('Page Not Found');
  });

  it('should display Benedicto College logo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logo = compiled.querySelector('img[alt="Benedicto College Logo"]') as HTMLImageElement;
    expect(logo).toBeTruthy();
    expect(logo.src).toContain('BcLogo.png');
  });

  it('should have navigation links in header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('header a[routerLink]');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should have quick links section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const quickLinksSection = compiled.querySelector('.quick-links');
    expect(quickLinksSection).toBeTruthy();
    
    const quickLinks = compiled.querySelectorAll('.quick-links a[routerLink]');
    expect(quickLinks.length).toBe(4); // Login, About, Support, Contact
  });

  it('should navigate to home when goHome() is called', async () => {
    spyOn(router, 'navigate');
    component.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call window.history.back() when goBack() is called', () => {
    spyOn(window.history, 'back');
    component.goBack();
    expect(window.history.back).toHaveBeenCalled();
  });

  it('should toggle mobile menu state', () => {
    expect(component.isMobileMenuOpen).toBeFalse();
    
    // Mock DOM elements
    const mockNavLinks = document.createElement('div');
    const mockHamburgerIcon = document.createElement('div');
    const mockCloseIcon = document.createElement('div');
    
    mockNavLinks.id = 'nav-links';
    mockHamburgerIcon.id = 'hamburger-icon';
    mockCloseIcon.id = 'close-icon';
    
    spyOn(document, 'getElementById').and.callFake((id: string) => {
      switch (id) {
        case 'nav-links': return mockNavLinks;
        case 'hamburger-icon': return mockHamburgerIcon;
        case 'close-icon': return mockCloseIcon;
        default: return null;
      }
    });
    
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBeTrue();
    
    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen).toBeFalse();
  });

  it('should have proper Benedicto College branding context', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandingSection = compiled.querySelector('.bg-gray-50');
    expect(brandingSection).toBeTruthy();
    expect(brandingSection?.textContent).toContain('Benedicto College Library Management System');
  });

  it('should have action buttons with proper styling', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');

    // Filter out mobile menu button and get action buttons
    const actionButtons = Array.from(buttons).filter(btn =>
      btn.textContent?.includes('Go to Homepage') || btn.textContent?.includes('Go Back')
    );

    expect(actionButtons.length).toBe(2);

    const homeButton = actionButtons.find(btn => btn.textContent?.includes('Go to Homepage'));
    const backButton = actionButtons.find(btn => btn.textContent?.includes('Go Back'));

    expect(homeButton).toBeTruthy();
    expect(backButton).toBeTruthy();
    expect(homeButton?.textContent?.trim()).toContain('Go to Homepage');
    expect(backButton?.textContent?.trim()).toContain('Go Back');
  });
});
