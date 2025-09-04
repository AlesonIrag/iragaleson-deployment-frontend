import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  // Mobile navigation state
  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    // Toggle mobile navigation visibility
    const navLinks = document.getElementById('nav-links');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const closeIcon = document.getElementById('close-icon');
    
    if (navLinks && hamburgerIcon && closeIcon) {
      if (this.isMobileMenuOpen) {
        navLinks.classList.add('mobile-open');
        hamburgerIcon.classList.add('hidden');
        closeIcon.classList.add('show');
      } else {
        navLinks.classList.remove('mobile-open');
        hamburgerIcon.classList.remove('hidden');
        closeIcon.classList.remove('show');
      }
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
