import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent implements OnInit, OnDestroy {
  private currentSlide = 0;
  private slides: NodeListOf<Element> | null = null;
  private slideInterval: any;

  ngOnInit() {
    // Enhanced mobile navigation functionality
    this.initializeMobileNavigation();

    // Background slideshow functionality
    this.initializeSlideshow();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private initializeMobileNavigation() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileNavPane = document.getElementById('mobile-nav-pane');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const closeNavButton = document.getElementById('close-nav-button');

    if (mobileMenuButton && mobileNavPane && mobileNavOverlay) {
      // Open navigation pane
      mobileMenuButton.addEventListener('click', () => {
        this.openMobileNav();
      });

      // Close navigation pane when clicking overlay
      mobileNavOverlay.addEventListener('click', () => {
        this.closeMobileNav();
      });

      // Close navigation pane when clicking close button
      if (closeNavButton) {
        closeNavButton.addEventListener('click', () => {
          this.closeMobileNav();
        });
      }

      // Close navigation when clicking nav links
      const navLinks = mobileNavPane.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          // Small delay to allow navigation to start
          setTimeout(() => {
            this.closeMobileNav();
          }, 150);
        });
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeMobileNav();
        }
      });
    }
  }

  private openMobileNav() {
    const mobileNavPane = document.getElementById('mobile-nav-pane');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const closeIcon = document.getElementById('close-icon');
    const mobileMenuButton = document.getElementById('mobile-menu-button');

    if (mobileNavPane && mobileNavOverlay) {
      // Show overlay
      mobileNavOverlay.classList.remove('hidden');
      mobileNavOverlay.classList.add('show');

      // Slide in navigation pane
      mobileNavPane.classList.add('open');

      // Switch icons
      if (hamburgerIcon && closeIcon) {
        hamburgerIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
        closeIcon.classList.add('show');
      }

      // Add active state to button
      if (mobileMenuButton) {
        mobileMenuButton.classList.add('active');
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  private closeMobileNav() {
    const mobileNavPane = document.getElementById('mobile-nav-pane');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const hamburgerIcon = document.getElementById('hamburger-icon');
    const closeIcon = document.getElementById('close-icon');
    const mobileMenuButton = document.getElementById('mobile-menu-button');

    if (mobileNavPane && mobileNavOverlay) {
      // Hide overlay
      mobileNavOverlay.classList.remove('show');
      setTimeout(() => {
        mobileNavOverlay.classList.add('hidden');
      }, 300);

      // Slide out navigation pane
      mobileNavPane.classList.remove('open');

      // Switch icons back
      if (hamburgerIcon && closeIcon) {
        closeIcon.classList.remove('show');
        closeIcon.classList.add('hidden');
        hamburgerIcon.classList.remove('hidden');
      }

      // Remove active state from button
      if (mobileMenuButton) {
        mobileMenuButton.classList.remove('active');
      }

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  private initializeSlideshow() {
    // Wait a bit for the DOM to be fully rendered
    setTimeout(() => {
      this.slides = document.querySelectorAll('.slide');
      if (this.slides && this.slides.length > 0) {
        console.log('Found slides:', this.slides.length);
        // Start the slideshow
        this.slideInterval = setInterval(() => {
          this.nextSlide();
        }, 4000); // Change slide every 4 seconds
      } else {
        console.log('No slides found');
      }
    }, 100);
  }

  private nextSlide() {
    if (!this.slides || this.slides.length === 0) return;

    console.log('Changing slide from', this.currentSlide, 'to', (this.currentSlide + 1) % this.slides.length);

    // Remove active class from current slide
    this.slides[this.currentSlide].classList.remove('active');

    // Move to next slide
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;

    // Add active class to new slide
    this.slides[this.currentSlide].classList.add('active');
  }
}