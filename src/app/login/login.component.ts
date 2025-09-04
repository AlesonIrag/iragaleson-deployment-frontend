import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentAuthService } from '../services/student-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  // Form data
  studentId: string = '';
  password: string = '';
  isLoading: boolean = false;

  // Error handling
  loginError: string = '';
  showLoginError: boolean = false;

  // Password visibility toggle
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private studentAuthService: StudentAuthService
  ) {}

  // Prevent all non-numeric input including paste, drag & drop
  onStudentIdKeydown(event: KeyboardEvent): void {
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
  onStudentIdInput(event: Event): void {
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
    this.validateStudentId(input);
  }

  // Handle paste events - only allow numeric content
  onStudentIdPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    const pastedText = event.clipboardData?.getData('text') || '';

    // Extract only numbers from pasted content
    const numericOnly = pastedText.replace(/\D/g, '').slice(0, 9);

    if (numericOnly) {
      input.value = numericOnly;
      // Trigger formatting
      this.onStudentIdInput(event);
    }
  }

  // Prevent drag and drop
  onStudentIdDrop(event: DragEvent): void {
    event.preventDefault();
  }

  // Prevent drag over
  onStudentIdDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  // Validate student ID format and required field
  validateStudentId(input: HTMLInputElement): void {
    const pattern = /^[0-9]{4}-[0-9]{5}$/;
    const errorDiv = document.getElementById('studentIdError');

    // Check if field is empty (required validation)
    if (!input.value.trim()) {
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
      errorDiv?.classList.remove('hidden');
      // Update error message for required field
      if (errorDiv) {
        errorDiv.textContent = 'Student ID is required!';
      }
    }
    // Check if field has value but doesn't match pattern (format validation)
    else if (input.value && !pattern.test(input.value)) {
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
      errorDiv?.classList.remove('hidden');
      // Update error message for format validation
      if (errorDiv) {
        errorDiv.textContent = 'Student ID must be exactly 9 digits (format: 2000-00000)';
      }
    }
    // Field is valid
    else {
      input.classList.remove('border-red-500');
      input.classList.add('border-gray-200');
      errorDiv?.classList.add('hidden');
    }
  }

  // Validate password on input
  onPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validatePassword(input);
  }

  // Validate student ID on blur (when user leaves the field)
  onStudentIdBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validateStudentId(input);
  }

  // Validate password on blur (when user leaves the field)
  onPasswordBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validatePassword(input);
  }

  // Validate password helper method
  validatePassword(input: HTMLInputElement): void {
    const errorDiv = document.getElementById('passwordError');

    if (input.value.trim() === '') {
      input.classList.add('border-red-500');
      input.classList.remove('border-gray-200');
      errorDiv?.classList.remove('hidden');
    } else {
      input.classList.remove('border-red-500');
      input.classList.add('border-gray-200');
      errorDiv?.classList.add('hidden');
    }
  }

  // Handle form submission
  onSubmit(event: Event): void {
    event.preventDefault();

    const studentIdInput = document.getElementById('studentId') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    // Always validate both fields to show individual error messages
    this.validateStudentId(studentIdInput);
    this.validatePassword(passwordInput);

    // Check if both fields are valid
    const pattern = /^[0-9]{4}-[0-9]{5}$/;
    if (!studentIdInput.value.trim() || !pattern.test(studentIdInput.value)) {
      isValid = false;
    }

    if (!passwordInput.value.trim()) {
      isValid = false;
    }

    if (isValid) {
      this.performLogin(studentIdInput.value, passwordInput.value);
    }
  }

  // Perform student login
  private performLogin(studentId: string, password: string): void {
    this.isLoading = true;

    this.studentAuthService.studentLogin(studentId, password).subscribe({
      next: (success: boolean) => {
        this.isLoading = false;

        if (success) {
          console.log('✅ Student login successful, redirecting to dashboard...');
          this.router.navigate(['/student-dashboard']).catch(() => {
            window.location.href = '/student-dashboard';
          });
        } else {
          console.error('❌ Student login failed');
          this.displayLoginError('Invalid student ID or password. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Student login error:', error);
        this.displayLoginError('Login failed. Please check your connection and try again.');
      }
    });
  }

  // Show login error message
  private displayLoginError(message: string): void {
    this.loginError = message;
    this.showLoginError = true;

    // Hide error after 5 seconds
    setTimeout(() => {
      this.showLoginError = false;
      this.loginError = '';
    }, 5000);
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

}


