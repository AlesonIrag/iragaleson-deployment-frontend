import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {

  // Current step: 'email', 'form', 'otp', or 'reset'
  currentStep: 'email' | 'form' | 'otp' | 'reset' = 'email';
  
  // User type from route parameter
  userType: 'student' | 'faculty' | 'admin' = 'student';

  // Email step data
  email: string = '';
  isEmailLoading: boolean = false;
  emailError: string = '';
  showEmailError: boolean = false;
  emailSuccess: boolean = false;

  // Form step data
  firstName: string = '';
  lastName: string = '';
  studentId: string = '';
  course: string = '';
  formEmail: string = '';
  phoneNumber: string = '';
  isFormLoading: boolean = false;
  formError: string = '';
  showFormError: boolean = false;
  formSuccess: boolean = false;

  // OTP step data
  otp: string = '';
  isOTPLoading: boolean = false;
  otpError: string = '';
  showOTPError: boolean = false;
  otpExpiryMinutes: number = 10;

  // Password reset step data
  resetToken: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isResetLoading: boolean = false;
  resetError: string = '';
  showResetError: boolean = false;
  resetSuccess: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Mobile menu state
  isMobileMenuOpen: boolean = false;

  // Available courses for dropdown
  courses: string[] = [
    'Bachelor of Science in Information Technology',
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Business Administration',
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Psychology',
    'Bachelor of Science in Education',
    'Bachelor of Science in Nursing',
    'Bachelor of Science in Engineering',
    'Bachelor of Arts in Communication',
    'Bachelor of Arts in English'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Get user type from route parameter
    this.route.params.subscribe(params => {
      const type = params['type'] as string;
      if (type === 'student' || type === 'faculty' || type === 'admin') {
        this.userType = type as 'student' | 'faculty' | 'admin';
      }
    });
  }

  // Get theme colors based on user type
  getThemeColors(): { primary: string, secondary: string, focus: string, ring: string } {
    switch (this.userType) {
      case 'admin':
        return {
          primary: 'red-600',
          secondary: 'red-700',
          focus: 'red-500',
          ring: 'red-200'
        };
      case 'faculty':
        return {
          primary: 'green-600',
          secondary: 'green-700',
          focus: 'green-500',
          ring: 'green-200'
        };
      default: // student
        return {
          primary: 'orange-600',
          secondary: 'orange-700',
          focus: 'blue-500',
          ring: 'blue-200'
        };
    }
  }

  // Get user type display name
  getUserTypeDisplay(): string {
    switch (this.userType) {
      case 'admin':
        return 'Administrator';
      case 'faculty':
        return 'Faculty';
      default:
        return 'Student';
    }
  }

  // Get appropriate login route
  getLoginRoute(): string {
    switch (this.userType) {
      case 'admin':
        return '/adminlogin';
      case 'faculty':
        return '/facultylogin';
      default:
        return '/login';
    }
  }

  // Toggle mobile menu
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Get button classes for submit buttons
  getButtonClasses(): string {
    const baseClasses = 'w-full text-white font-semibold py-2.5 px-4 rounded-xl transition duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm';

    switch (this.userType) {
      case 'student':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl`;
      case 'faculty':
        return `${baseClasses} bg-green-600 hover:bg-green-700`;
      case 'admin':
        return `${baseClasses} bg-red-600 hover:bg-red-700`;
      default:
        return `${baseClasses} bg-blue-600 hover:bg-blue-700`;
    }
  }

  // Get input focus classes
  getInputFocusClasses(): string {
    const baseClasses = 'w-full px-3 py-2 border-2 border-gray-200 rounded-xl transition duration-300 bg-white text-gray-900 placeholder-gray-500 text-sm';

    switch (this.userType) {
      case 'student':
        return `${baseClasses} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`;
      case 'faculty':
        return `${baseClasses} focus:border-green-500 focus:ring-2 focus:ring-green-200`;
      case 'admin':
        return `${baseClasses} focus:border-red-500 focus:ring-2 focus:ring-red-200`;
      default:
        return `${baseClasses} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`;
    }
  }

  // Get step indicator classes
  getStepClasses(step: 'email' | 'form' | 'otp' | 'reset', isActive: boolean): string {
    if (!isActive) {
      return 'bg-gray-200 text-gray-600';
    }

    switch (this.userType) {
      case 'student':
        return 'bg-blue-600 text-white';
      case 'faculty':
        return 'bg-green-600 text-white';
      case 'admin':
        return 'bg-red-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  }

  // Get step text classes
  getStepTextClasses(step: 'email' | 'form' | 'otp' | 'reset', isActive: boolean): string {
    if (!isActive) {
      return 'text-gray-500';
    }

    switch (this.userType) {
      case 'student':
        return 'text-blue-600';
      case 'faculty':
        return 'text-green-600';
      case 'admin':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  }

  // Get link classes
  getLinkClasses(): string {
    const baseClasses = 'text-sm font-semibold transition duration-300';

    switch (this.userType) {
      case 'student':
        return `${baseClasses} text-blue-600 hover:text-blue-700`;
      case 'faculty':
        return `${baseClasses} text-green-600 hover:text-green-700`;
      case 'admin':
        return `${baseClasses} text-red-600 hover:text-red-700`;
      default:
        return `${baseClasses} text-blue-600 hover:text-blue-700`;
    }
  }

  // Get back to login link classes
  getBackLinkClasses(): string {
    const baseClasses = 'text-sm font-semibold text-gray-600 transition duration-300';

    switch (this.userType) {
      case 'student':
        return `${baseClasses} hover:text-blue-600`;
      case 'faculty':
        return `${baseClasses} hover:text-green-600`;
      case 'admin':
        return `${baseClasses} hover:text-red-600`;
      default:
        return `${baseClasses} hover:text-blue-600`;
    }
  }

  // Switch to form step
  switchToForm(): void {
    this.currentStep = 'form';
    this.clearEmailError();
  }

  // Switch to email step
  switchToEmail(): void {
    this.currentStep = 'email';
    this.clearFormError();
  }

  // Back to email from OTP
  backToEmail(): void {
    this.currentStep = 'email';
    this.clearOTPError();
    this.otp = '';
  }

  // Resend OTP
  resendOTP(): void {
    this.clearOTPError();
    this.otp = '';
    this.onEmailSubmit(new Event('submit'));
  }

  // Clear email error
  clearEmailError(): void {
    this.emailError = '';
    this.showEmailError = false;
  }

  // Clear form error
  clearFormError(): void {
    this.formError = '';
    this.showFormError = false;
  }

  // Display email error
  displayEmailError(message: string): void {
    this.emailError = message;
    this.showEmailError = true;
  }

  // Display form error
  displayFormError(message: string): void {
    this.formError = message;
    this.showFormError = true;
  }

  // Clear OTP error
  clearOTPError(): void {
    this.otpError = '';
    this.showOTPError = false;
  }

  // Clear reset error
  clearResetError(): void {
    this.resetError = '';
    this.showResetError = false;
  }

  // Display OTP error
  displayOTPError(message: string): void {
    this.otpError = message;
    this.showOTPError = true;
  }

  // Display reset error
  displayResetError(message: string): void {
    this.resetError = message;
    this.showResetError = true;
  }

  // Toggle password visibility
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Handle email form submission
  onEmailSubmit(event: Event): void {
    event.preventDefault();

    if (this.isEmailLoading) return;

    this.clearEmailError();

    // Validate email
    if (!this.email.trim()) {
      this.displayEmailError('Email address is required');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.displayEmailError('Please enter a valid email address');
      return;
    }

    this.isEmailLoading = true;

    // Call API to request OTP
    this.apiService.requestOTP(this.email, this.userType).subscribe({
      next: (response) => {
        this.isEmailLoading = false;
        if (response.success) {
          this.otpExpiryMinutes = response.data?.expiresIn || 10;
          this.currentStep = 'otp';
        } else {
          this.displayEmailError(response.message || 'Failed to send OTP');
        }
      },
      error: (error) => {
        this.isEmailLoading = false;
        if (error.error?.suggestManualForm) {
          this.displayEmailError(error.error.message + ' Please use the manual request form below.');
        } else {
          this.displayEmailError('Failed to send OTP. Please try again.');
        }
      }
    });
  }

  // Handle manual form submission
  onFormSubmit(event: Event): void {
    event.preventDefault();
    
    if (this.isFormLoading) return;

    this.clearFormError();

    // Validate required fields
    if (!this.firstName.trim()) {
      this.displayFormError('First name is required');
      return;
    }

    if (!this.lastName.trim()) {
      this.displayFormError('Last name is required');
      return;
    }

    if (this.userType === 'student') {
      if (!this.studentId.trim()) {
        this.displayFormError('Student ID is required');
        return;
      }

      // Validate student ID format
      const studentIdPattern = /^[0-9]{4}-[0-9]{5}$/;
      if (!studentIdPattern.test(this.studentId)) {
        this.displayFormError('Student ID must be in format YYYY-NNNNN (e.g., 2000-00001)');
        return;
      }

      if (!this.course.trim()) {
        this.displayFormError('Course is required');
        return;
      }
    }

    if (!this.formEmail.trim()) {
      this.displayFormError('Email address is required');
      return;
    }

    if (!this.isValidEmail(this.formEmail)) {
      this.displayFormError('Please enter a valid email address');
      return;
    }

    this.isFormLoading = true;

    // Simulate API call for manual password reset request
    setTimeout(() => {
      this.isFormLoading = false;
      this.formSuccess = true;
      
      // Show success message for 3 seconds then redirect
      setTimeout(() => {
        this.router.navigate([this.getLoginRoute()]);
      }, 3000);
    }, 2000);
  }

  // Handle student ID input formatting
  onStudentIdInput(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits

    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4, 9);
    }

    this.studentId = value;
    event.target.value = value;
  }

  // Handle OTP form submission
  onOTPSubmit(event: Event): void {
    event.preventDefault();

    if (this.isOTPLoading) return;

    this.clearOTPError();

    // Validate OTP
    if (!this.otp.trim()) {
      this.displayOTPError('OTP is required');
      return;
    }

    if (this.otp.length !== 6 || !/^\d{6}$/.test(this.otp)) {
      this.displayOTPError('Please enter a valid 6-digit OTP');
      return;
    }

    this.isOTPLoading = true;

    // Call API to verify OTP
    this.apiService.verifyOTP(this.email, this.userType, this.otp).subscribe({
      next: (response) => {
        this.isOTPLoading = false;
        if (response.success) {
          this.resetToken = (response as any).resetToken || '';
          this.currentStep = 'reset';
        } else {
          this.displayOTPError(response.message || 'Invalid OTP');
        }
      },
      error: (error) => {
        this.isOTPLoading = false;
        this.displayOTPError(error.error?.message || 'Failed to verify OTP. Please try again.');
      }
    });
  }

  // Handle password reset form submission
  onPasswordResetSubmit(event: Event): void {
    event.preventDefault();

    if (this.isResetLoading) return;

    this.clearResetError();

    // Validate passwords
    if (!this.newPassword.trim()) {
      this.displayResetError('New password is required');
      return;
    }

    if (this.newPassword.length < 6) {
      this.displayResetError('Password must be at least 6 characters long');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(this.newPassword)) {
      this.displayResetError('Password must contain uppercase, lowercase, and number');
      return;
    }

    if (!this.confirmPassword.trim()) {
      this.displayResetError('Please confirm your password');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.displayResetError('Passwords do not match');
      return;
    }

    this.isResetLoading = true;

    // Call API to reset password
    this.apiService.resetPassword(this.resetToken, this.newPassword, this.confirmPassword).subscribe({
      next: (response) => {
        this.isResetLoading = false;
        if (response.success) {
          this.resetSuccess = true;
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate([this.getLoginRoute()]);
          }, 3000);
        } else {
          this.displayResetError(response.message || 'Failed to reset password');
        }
      },
      error: (error) => {
        this.isResetLoading = false;
        this.displayResetError(error.error?.message || 'Failed to reset password. Please try again.');
      }
    });
  }

  // Handle student ID keydown
  onStudentIdKeydown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(event.key) || 
        (event.key >= '0' && event.key <= '9') ||
        (event.ctrlKey && (event.key === 'a' || event.key === 'c' || event.key === 'v'))) {
      return;
    }
    
    event.preventDefault();
  }
}
