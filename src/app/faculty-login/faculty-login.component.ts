import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FacultyAuthService } from '../services/faculty-auth.service';

@Component({
  selector: 'app-faculty-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './faculty-login.html',
  styleUrl: './faculty-login.css'
})
export class FacultyLoginComponent {

  // Form data
  facultyId: string = '';
  password: string = '';
  isLoading: boolean = false;

  // Error handling
  loginError: string = '';
  showLoginError: boolean = false;

  // Password visibility toggle
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private facultyAuthService: FacultyAuthService
  ) {}

  // Prevent all non-numeric input including paste, drag & drop
  onFacultyIdKeydown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    // Allow navigation and control keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Only allow digits 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Handle input formatting and validation
  onFacultyIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Remove all non-numeric characters
    let value = input.value.replace(/\D/g, '');

    // Limit to maximum 9 digits
    if (value.length > 9) {
      value = value.slice(0, 9);
    }

    // Format: XXXX-XXXXX (4 digits, dash, 5 digits)
    if (value.length > 4) {
      input.value = `${value.slice(0, 4)}-${value.slice(4)}`;
    } else {
      input.value = value;
    }

    // Validate the format
    this.validateFacultyId(input);
  }

  // Handle paste events - only allow numeric content
  onFacultyIdPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    const pastedText = event.clipboardData?.getData('text') || '';

    // Extract only numeric characters and limit to 9 digits
    const numericOnly = pastedText.replace(/\D/g, '').slice(0, 9);

    if (numericOnly) {
      input.value = numericOnly;
      // Trigger formatting
      this.onFacultyIdInput(event);
    }
  }

  // Prevent drag and drop
  onFacultyIdDrop(event: DragEvent): void {
    event.preventDefault();
  }

  // Prevent drag over
  onFacultyIdDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // Clear login error
  clearLoginError(): void {
    this.showLoginError = false;
    this.loginError = '';
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Handle faculty ID blur validation
  onFacultyIdBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validateFacultyId(input);
  }

  // Validate faculty ID format and required field
  validateFacultyId(input: HTMLInputElement): void {
    const pattern = /^[0-9]{4}-[0-9]{5}$/;
    const errorDiv = document.getElementById('facultyIdError');

    // Check if field is empty (required validation)
    if (!input.value.trim()) {
      this.showFacultyIdError('Faculty ID is required!');
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
      return;
    }

    // Check if format is correct (YYYY-NNNNN)
    if (!pattern.test(input.value)) {
      this.showFacultyIdError('Faculty ID must be exactly 9 digits (format: 2000-00000)');
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
      return;
    }

    // If we get here, the faculty ID is valid
    this.hideFacultyIdError();
    input.classList.remove('border-red-500');
    input.classList.add('border-gray-200');
  }

  // Show faculty ID error
  showFacultyIdError(message: string): void {
    const errorDiv = document.getElementById('facultyIdError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  // Hide faculty ID error
  hideFacultyIdError(): void {
    const errorDiv = document.getElementById('facultyIdError');
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

    let isValid = true;

    // Clear previous errors
    this.clearLoginError();

    // Validate faculty ID
    const pattern = /^[0-9]{4}-[0-9]{5}$/;
    if (!this.facultyId.trim()) {
      this.displayLoginError('Faculty ID is required');
      isValid = false;
    } else if (!pattern.test(this.facultyId)) {
      this.displayLoginError('Faculty ID must be in format YYYY-NNNNN (e.g., 2022-00001)');
      isValid = false;
    }

    // Validate password
    if (!this.password.trim()) {
      this.displayLoginError('Password is required');
      isValid = false;
    }

    if (isValid) {
      this.performLogin(this.facultyId, this.password);
    }
  }

  // Perform faculty login
  private performLogin(facultyId: string, password: string): void {
    this.isLoading = true;

    this.facultyAuthService.facultyLogin(facultyId, password).subscribe({
      next: (success: boolean) => {
        this.isLoading = false;

        if (success) {
          console.log('✅ Faculty login successful, redirecting to dashboard...');
          this.router.navigate(['/faculty-dashboard']).catch(() => {
            window.location.href = '/faculty-dashboard';
          });
        } else {
          console.error('❌ Faculty login failed');
          this.displayLoginError('Invalid faculty ID or password. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Faculty login error:', error);
        this.displayLoginError('Login failed. Please check your connection and try again.');
      }
    });
  }

  // Display login error message
  private displayLoginError(message: string): void {
    this.loginError = message;
    this.showLoginError = true;

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      this.showLoginError = false;
    }, 5000);
  }

}
