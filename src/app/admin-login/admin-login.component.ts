import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLoginComponent implements OnInit {

  private returnUrl: string = '/dashboard';
  isLoading: boolean = false;

  // Password visibility toggle
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Check current authentication state
    const isAuth = this.authService.isAuthenticated();
    const currentAdmin = this.authService.getCurrentAdmin();

    // If already authenticated, redirect to dashboard
    if (isAuth && currentAdmin) {
      this.router.navigate([this.returnUrl]);
    }
  }

  // Handle email input
  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.hideEmailError();
  }

  // Handle email blur validation
  onEmailBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validateEmail(input);
  }

  // Validate email format
  validateEmail(input: HTMLInputElement): void {
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) {
      this.showEmailError('Email is required!');
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
    } else if (!emailRegex.test(value)) {
      this.showEmailError('Please enter a valid email address!');
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
    } else {
      this.hideEmailError();
      input.classList.remove('border-red-500');
      input.classList.add('border-gray-200');
    }
  }

  // Show email error
  showEmailError(message: string): void {
    const errorDiv = document.getElementById('emailError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  // Hide email error
  hideEmailError(): void {
    const errorDiv = document.getElementById('emailError');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  // Handle password input
  onPasswordInput(event: Event): void {
    this.hidePasswordError();
  }

  // Handle password blur validation
  onPasswordBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validatePassword(input);
  }

  // Validate password
  validatePassword(input: HTMLInputElement): void {
    const value = input.value.trim();
    
    if (!value) {
      this.showPasswordError('Password is required!');
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
    } else {
      this.hidePasswordError();
      input.classList.remove('border-red-500');
      input.classList.add('border-gray-200');
    }
  }

  // Show password error
  showPasswordError(message: string): void {
    const errorDiv = document.getElementById('passwordError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  // Hide password error
  hidePasswordError(): void {
    const errorDiv = document.getElementById('passwordError');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  // Handle form submission
  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.isLoading) return;

    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    // Always validate both fields to show individual error messages
    this.validateEmail(emailInput);
    this.validatePassword(passwordInput);

    // Check if both fields are valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      isValid = false;
    }

    if (!passwordInput.value.trim()) {
      isValid = false;
    }

    if (isValid) {
      this.isLoading = true;
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      this.authService.adminLogin(email, password).subscribe({
        next: (success: boolean) => {
          this.isLoading = false;

          if (success) {
            // Force refresh authentication state and then navigate
            this.authService.refreshAuthState();

            // Add a small delay to ensure authentication state is fully updated
            setTimeout(() => {
              this.router.navigate([this.returnUrl]).catch(() => {
                // Fallback to direct navigation
                window.location.href = this.returnUrl;
              });
            }, 200);
          } else {
            console.log('❌ Login failed - showing error message');
            this.showLoginError('Invalid email or password. Please try again.');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Login error:', error);
          this.showLoginError('Login failed. Please check your connection and try again.');
        }
      });
    }
  }

  // Show general login error
  showLoginError(message: string): void {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');

      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

}
