import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AdminUser, ProfileUpdateData } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { ThemeService } from '../../services/theme.service';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber: string;
  profilePhoto?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  isEditing: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  
  profileData: ProfileData = {
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phoneNumber: '',
    profilePhoto: ''
  };

  originalProfileData: ProfileData = {
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    phoneNumber: '',
    profilePhoto: ''
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Upload modal properties
  showUploadModal: boolean = false;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  uploadSuccess: boolean = false;
  uploadError: string | null = null;

  // Change password modal properties
  showChangePasswordModal = false;
  isChangingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordError: string | null = null;
  passwordSuccess: string | null = null;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private themeService: ThemeService
  ) {}

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  private loadProfileData(): void {
    this.isLoading = true;

    // Get profile details from auth service
    this.authService.getProfileDetails().subscribe({
      next: (admin) => {
        if (admin) {
          // Parse the full name to get first and last name
          const nameParts = admin.fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          this.profileData = {
            firstName: firstName,
            lastName: lastName,
            email: admin.email,
            role: admin.role,
            phoneNumber: admin.phoneNumber || '',
            profilePhoto: admin.profilePhoto || this.getDefaultProfilePhoto(firstName)
          };

          // Store original data for reset functionality
          this.originalProfileData = { ...this.profileData };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile data:', error);
        this.isLoading = false;
      }
    });
  }

  private getDefaultProfilePhoto(firstName: string): string {
    const initial = firstName.charAt(0).toUpperCase() || 'A';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%233B82F6'/%3E%3Ctext x='60' y='75' text-anchor='middle' fill='white' font-family='Arial' font-size='48' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  }

  getSafeImageUrl(): string {
    if (this.previewUrl) {
      return this.previewUrl;
    }

    if (this.profileData.profilePhoto && this.profileData.profilePhoto.trim() !== '') {
      let imageUrl = this.profileData.profilePhoto;

      // Convert relative URLs to full backend URLs
      if (imageUrl.startsWith('/api/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
      }

      return imageUrl;
    }

    // Return default admin avatar
    return this.getDefaultProfilePhoto(this.profileData.firstName);
  }

  onImageError(event: any): void {
    console.log('🖼️ Image load error, falling back to default');
    event.target.src = this.getDefaultProfilePhoto(this.profileData.firstName);
  }

  onImageLoad(event: any): void {
    console.log('🖼️ Image loaded successfully');
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        this.toastService.error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('File size must be less than 5MB.');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
        this.showUploadModal = true;
      };
      reader.readAsDataURL(file);
    }

    // Reset the input value so the same file can be selected again
    event.target.value = '';
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.profileData.profilePhoto = this.getDefaultProfilePhoto(this.profileData.firstName);
  }

  // Upload modal methods
  closeUploadModal(): void {
    this.showUploadModal = false;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = null;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  uploadProfilePhoto(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = null;

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 20;
      }
    }, 200);

    console.log('Starting admin profile photo upload...');

    this.authService.uploadProfilePhoto(this.selectedFile).subscribe({
      next: (imageUrl) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;

        console.log('Admin upload successful, imageUrl:', imageUrl);

        if (imageUrl) {
          // Store the clean URL without cache-busting parameter
          this.profileData.profilePhoto = imageUrl;
          this.uploadSuccess = true;
          this.toastService.success('Profile photo uploaded successfully!');

          // Force refresh the profile photo display
          this.previewUrl = null;

          setTimeout(() => {
            this.saveProfile();
            // Close modal after successful upload and update
            setTimeout(() => {
              this.closeUploadModal();
            }, 500);
          }, 1000);
        } else {
          this.uploadError = 'Upload completed but no image URL received';
          this.toastService.error('Upload completed but no image URL received');
        }

        this.isUploading = false;
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('Admin upload error:', error);
        this.uploadError = error.message || 'Failed to upload profile photo. Please try again.';
        this.toastService.error(this.uploadError || 'Upload failed');
        this.isUploading = false;
      }
    });
  }

  toggleEdit(): void {
    if (this.isEditing) {
      // Cancel editing - reset to original data
      this.profileData = { ...this.originalProfileData };
      this.selectedFile = null;
      this.previewUrl = null;
    }
    this.isEditing = !this.isEditing;
  }

  saveProfile(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    // Prepare profile update data
    const updateData: ProfileUpdateData = {
      firstName: this.profileData.firstName,
      lastName: this.profileData.lastName,
      email: this.profileData.email,
      phoneNumber: this.profileData.phoneNumber,
      profilePhoto: this.profileData.profilePhoto
    };

    // Update profile using auth service
    this.authService.updateProfile(updateData).subscribe({
      next: (success) => {
        if (success) {
          // Update original data
          this.originalProfileData = { ...this.profileData };

          this.isSaving = false;
          this.isEditing = false;
          this.selectedFile = null;
          this.previewUrl = null;

          this.toastService.success('Profile updated successfully!');
        } else {
          this.isSaving = false;
          this.toastService.error('Failed to update profile. Please try again.');
        }
      },
      error: (error) => {
        console.error('Profile update error:', error);
        this.isSaving = false;
        this.toastService.error('An error occurred while updating your profile.');
      }
    });
  }

  private validateForm(): boolean {
    if (!this.profileData.firstName.trim()) {
      this.toastService.error('First name is required.');
      return false;
    }

    if (!this.profileData.lastName.trim()) {
      this.toastService.error('Last name is required.');
      return false;
    }

    if (!this.profileData.email.trim()) {
      this.toastService.error('Email is required.');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profileData.email)) {
      this.toastService.error('Please enter a valid email address.');
      return false;
    }

    return true;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Utility methods for styling
  getContainerClasses(): string {
    return this.isDarkMode 
      ? 'min-h-screen bg-gray-900 text-white' 
      : 'min-h-screen bg-gray-50 text-gray-900';
  }

  getCardClasses(): string {
    return this.isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200';
  }

  getInputClasses(): string {
    return this.isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500';
  }

  getButtonClasses(type: 'primary' | 'secondary' | 'danger'): string {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (type) {
      case 'primary':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
      case 'secondary':
        return this.isDarkMode 
          ? `${baseClasses} bg-gray-700 hover:bg-gray-600 text-white border border-gray-600` 
          : `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300`;
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white`;
      default:
        return baseClasses;
    }
  }

  // Change Password Modal Methods
  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
    this.resetPasswordData();
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.resetPasswordData();
  }

  resetPasswordData(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.isChangingPassword = false;
    this.passwordError = null;
    this.passwordSuccess = null;
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async changePassword(): Promise<void> {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toastService.error('New passwords do not match');
      return;
    }

    if (this.passwordData.newPassword.length < 8) {
      this.toastService.error('New password must be at least 8 characters long');
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    try {
      const token = localStorage.getItem('adminToken');
      console.log('Admin Token:', token); // Debug log
      console.log('Current Password:', this.passwordData.currentPassword); // Debug log
      console.log('New Password:', this.passwordData.newPassword); // Debug log

      const response = await fetch('http://localhost:3000/api/v1/adminauth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: this.passwordData.currentPassword,
          newPassword: this.passwordData.newPassword
        })
      });

      const result = await response.json();
      console.log('Admin Password Change Response:', response.status, result); // Debug log

      if (response.ok) {
        this.passwordSuccess = 'Password changed successfully!';
        this.toastService.success('Password changed successfully!');
        
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => {
          this.passwordSuccess = null;
        }, 5000);
        
        // Close modal after success
        setTimeout(() => {
          this.closeChangePasswordModal();
        }, 2000);
      } else {
        this.passwordError = result.message || 'Failed to change password';
        this.toastService.error(this.passwordError || 'Failed to change password');
        
        // Auto-dismiss error message after 5 seconds
        setTimeout(() => {
          this.passwordError = null;
        }, 5000);
      }
    } catch (error) {
      console.error('Error changing admin password:', error);
      this.passwordError = 'An error occurred while changing password';
      this.toastService.error('An error occurred while changing password');
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        this.passwordError = null;
      }, 5000);
    } finally {
      this.isChangingPassword = false;
    }
  }
}
