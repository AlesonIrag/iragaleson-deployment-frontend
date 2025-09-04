import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FacultyAuthService, DetailedFaculty } from '../services/faculty-auth.service';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../components/toast/toast.component';

interface FacultyProfileData {
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  facultyId: string;
  department: string;
  position: string;
  email: string;
  phoneNumber: string;
  profilePhoto?: string;
}

interface FacultyProfileUpdateData {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  suffix?: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  profilePhoto?: string;
}

@Component({
  selector: 'app-faculty-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './faculty-profile.component.html',
  styleUrls: ['./faculty-profile.component.css']
})
export class FacultyProfileComponent implements OnInit {
  isDarkMode: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  
  profileData: FacultyProfileData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    facultyId: '',
    department: '',
    position: '',
    email: '',
    phoneNumber: '',
    profilePhoto: ''
  };

  originalProfileData: FacultyProfileData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    facultyId: '',
    department: '',
    position: '',
    email: '',
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
    private facultyAuthService: FacultyAuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDarkModePreference();
    this.loadProfileData();
  }

  private loadDarkModePreference(): void {
    const darkMode = localStorage.getItem('darkMode');
    this.isDarkMode = darkMode === 'true';
  }

  private loadProfileData(): void {
    this.isLoading = true;

    // Get detailed faculty profile from auth service
    this.facultyAuthService.getDetailedProfile().subscribe({
      next: (detailedFaculty) => {
        if (detailedFaculty) {
          this.profileData = {
            firstName: detailedFaculty.firstName,
            lastName: detailedFaculty.lastName,
            middleInitial: detailedFaculty.middleInitial || '',
            suffix: detailedFaculty.suffix || '',
            facultyId: detailedFaculty.facultyId,
            department: detailedFaculty.department,
            position: detailedFaculty.position,
            email: detailedFaculty.email,
            phoneNumber: detailedFaculty.phoneNumber || '',
            profilePhoto: detailedFaculty.profilePhoto || this.getDefaultProfilePhoto(detailedFaculty.firstName)
          };

          // Store original data for cancel functionality
          this.originalProfileData = { ...this.profileData };
          console.log('✅ Faculty profile data loaded:', this.profileData);
        } else {
          console.log('⚠️ No detailed faculty data, loading basic profile');
          this.loadBasicProfileData();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading detailed faculty profile:', error);
        console.log('⚠️ Falling back to basic profile data');
        this.loadBasicProfileData();
        this.isLoading = false;
      }
    });
  }

  private loadBasicProfileData(): void {
    // Fallback method using basic faculty data
    const currentFaculty = this.facultyAuthService.getCurrentFaculty();
    if (currentFaculty) {
      // Parse the full name to get individual components
      const nameParts = currentFaculty.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      this.profileData = {
        firstName: firstName,
        lastName: lastName,
        middleInitial: '',
        suffix: '',
        facultyId: currentFaculty.facultyId,
        department: currentFaculty.department,
        position: currentFaculty.position,
        email: currentFaculty.email,
        phoneNumber: currentFaculty.phoneNumber || '',
        profilePhoto: this.getDefaultProfilePhoto(firstName)
      };

      // Store original data for cancel functionality
      this.originalProfileData = { ...this.profileData };
      console.log('✅ Basic faculty profile data loaded:', this.profileData);
    } else {
      console.error('❌ No current faculty found');
      this.router.navigate(['/facultylogin']);
    }
  }

  private getDefaultProfilePhoto(firstName: string): string {
    const initial = firstName ? firstName.charAt(0).toUpperCase() : 'F';
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#3B82F6"/>
        <text x="60" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">${initial}</text>
      </svg>
    `)}`;
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/faculty-dashboard']);
  }

  // Edit mode methods
  enableEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.profileData = { ...this.originalProfileData };
    this.isEditing = false;
    this.selectedFile = null;
    this.previewUrl = null;
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
    const updateData: FacultyProfileUpdateData = {
      firstName: this.profileData.firstName,
      lastName: this.profileData.lastName,
      middleInitial: this.profileData.middleInitial,
      suffix: this.profileData.suffix,
      email: this.profileData.email,
      phoneNumber: this.profileData.phoneNumber,
      department: this.profileData.department,
      position: this.profileData.position,
      profilePhoto: this.profileData.profilePhoto
    };

    // Update profile using auth service
    this.facultyAuthService.updateDetailedProfile(updateData).subscribe({
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

  // Profile update methods
  updateProfileData(): void {
    console.log('🚀 updateProfileData called');
    console.log('📝 Current profile data:', this.profileData);
    console.log('📝 Original profile data:', this.originalProfileData);
    console.log('🔄 Has changes:', this.hasChanges());

    if (!this.hasChanges()) {
      console.log('ℹ️ No changes detected, exiting edit mode');
      this.isEditing = false;
      return;
    }

    this.isSaving = true;
    const currentFaculty = this.facultyAuthService.getCurrentFaculty();
    console.log('👤 Current faculty:', currentFaculty);

    if (currentFaculty) {
      // Only include fields that have valid values (not empty strings)
      const updates: any = {};

      if (this.profileData.firstName && this.profileData.firstName.trim()) {
        updates.firstName = this.profileData.firstName.trim();
      }

      if (this.profileData.lastName && this.profileData.lastName.trim()) {
        updates.lastName = this.profileData.lastName.trim();
      }

      if (this.profileData.middleInitial && this.profileData.middleInitial.trim() && this.profileData.middleInitial !== 'N/A') {
        updates.middleInitial = this.profileData.middleInitial.trim();
      }

      if (this.profileData.suffix && this.profileData.suffix.trim() && this.profileData.suffix !== 'N/A') {
        updates.suffix = this.profileData.suffix.trim();
      }

      if (this.profileData.email && this.profileData.email.trim()) {
        updates.email = this.profileData.email.trim();
      }

      if (this.profileData.phoneNumber && this.profileData.phoneNumber.trim()) {
        updates.phoneNumber = this.profileData.phoneNumber.trim();
      }

      if (this.profileData.department && this.profileData.department.trim()) {
        updates.department = this.profileData.department.trim();
      }

      if (this.profileData.position && this.profileData.position.trim()) {
        updates.position = this.profileData.position.trim();
      }

      if (this.profileData.profilePhoto && this.profileData.profilePhoto.trim()) {
        updates.profilePhoto = this.profileData.profilePhoto.trim();
      }

      console.log('📤 Sending updates (filtered):', updates);

      // Check if there are actually fields to update
      if (Object.keys(updates).length === 0) {
        console.log('ℹ️ No valid fields to update');
        this.isSaving = false;
        this.isEditing = false;
        return;
      }

      this.facultyAuthService.updateDetailedProfile(updates).subscribe({
        next: (success) => {
          if (success) {
            console.log('✅ Faculty profile updated successfully');
            this.originalProfileData = { ...this.profileData };
            this.isEditing = false;
            this.selectedFile = null;
            this.previewUrl = null;
            this.showUploadModal = false;

            this.toastService.success('Profile updated successfully!');
          } else {
            console.error('❌ Failed to update faculty profile');
            this.toastService.error('Failed to update profile. Please try again.');
          }
          this.isSaving = false;
        },
        error: (error) => {
          console.error('❌ Error updating faculty profile:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error details:', error.error);
          if (error.error && error.error.details) {
            console.error('❌ Validation errors:', error.error.details);
          }
          this.toastService.error('An error occurred while updating your profile.');
          this.isSaving = false;
        }
      });
    }
  }

  hasChanges(): boolean {
    return JSON.stringify(this.profileData) !== JSON.stringify(this.originalProfileData);
  }

  // File upload methods
  onFileSelected(event: any): void {
    console.log('📁 File selection event triggered:', event);
    const file = event.target.files[0];
    console.log('📁 Selected file:', file);

    if (file) {
      console.log('📁 File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        console.error('❌ Invalid file type:', file.type);
        this.toastService.error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.error('❌ File too large:', file.size);
        this.toastService.error('File size must be less than 5MB.');
        return;
      }

      console.log('✅ File validation passed');
      this.selectedFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        console.log('✅ Preview URL created');
      };
      reader.readAsDataURL(file);

      console.log('📤 Opening upload modal');
      this.showUploadModal = true;
    } else {
      console.log('❌ No file selected');
    }
  }

  uploadProfilePhoto(): void {
    console.log('🚀 Upload button clicked');
    console.log('📁 Selected file:', this.selectedFile);

    if (!this.selectedFile) {
      console.error('❌ No file selected');
      return;
    }

    console.log('📤 Starting upload process...');
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = null;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 20;
      }
    }, 200);

    // Check faculty authentication state
    const currentFaculty = this.facultyAuthService.getCurrentFaculty();
    const isAuthenticated = this.facultyAuthService.isAuthenticated();
    console.log('👤 Current faculty:', currentFaculty);
    console.log('🔐 Is authenticated:', isAuthenticated);

    if (!currentFaculty || !isAuthenticated) {
      console.error('❌ Faculty not authenticated');
      this.uploadError = 'Authentication required. Please log in again.';
      this.toastService.error('Authentication required. Please log in again.');
      this.isUploading = false;
      return;
    }

    console.log('🔄 Calling faculty auth service...');
    this.facultyAuthService.uploadProfilePhoto(this.selectedFile).subscribe({
      next: (imageUrl) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;

        console.log('Upload completed with imageUrl:', imageUrl);

        if (imageUrl) {
          // Store the relative URL directly (without cache-busting for database)
          console.log('🔗 FACULTY PROFILE: Received imageUrl from upload:', imageUrl);

          // Store the clean URL without cache-busting parameter
          this.profileData.profilePhoto = imageUrl;
          console.log('✅ FACULTY PROFILE: profileData.profilePhoto updated to:', this.profileData.profilePhoto);
          this.uploadSuccess = true;
          this.toastService.success('Profile photo uploaded successfully!');

          // Force refresh the profile photo display
          this.previewUrl = null;

          setTimeout(() => {
            console.log('⏰ FACULTY PROFILE: About to call updateProfileData() after upload');
            console.log('📸 FACULTY PROFILE: profileData.profilePhoto before update:', this.profileData.profilePhoto);
            this.updateProfileData();
            // Close modal after successful upload and update
            setTimeout(() => {
              this.closeUploadModal();
            }, 500);
          }, 1000); // Show success for 1 second before continuing
        } else {
          console.error('Upload returned null imageUrl');
          this.uploadError = 'Upload completed but no image URL received';
          this.toastService.error('Upload completed but no image URL received');
          this.isUploading = false;
          this.isSaving = false;
        }
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('❌ Error uploading profile photo:', error);
        this.uploadError = 'Failed to upload profile photo. Please try again.';
        this.toastService.error('Failed to upload profile photo. Please try again.');
        this.isUploading = false;
        this.isSaving = false;
      }
    });
  }

  confirmUpload(): void {
    if (this.selectedFile) {
      this.uploadProfilePhoto();
    }
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = null;
  }

  // Image handling methods
  getSafeImageUrl(): string {
    if (this.profileData.profilePhoto && this.profileData.profilePhoto.trim() !== '') {
      let imageUrl = this.profileData.profilePhoto;

      // Convert relative URLs to full backend URLs
      if (imageUrl.startsWith('/api/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
      }

      return imageUrl;
    }

    // Return default faculty avatar
    const initial = this.profileData.firstName ? this.profileData.firstName.charAt(0).toUpperCase() : 'F';
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#3B82F6"/>
        <text x="60" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">${initial}</text>
      </svg>
    `)}`;
  }

  onImageError(event: any): void {
    console.log('🖼️ Image load error, falling back to default');
    const initial = this.profileData.firstName ? this.profileData.firstName.charAt(0).toUpperCase() : 'F';
    event.target.src = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#3B82F6"/>
        <text x="60" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">${initial}</text>
      </svg>
    `)}`;
  }

  onImageLoad(event: any): void {
    console.log('🖼️ Faculty profile image loaded successfully');
  }

  // Utility methods
  getDisplayValue(value: string): string {
    return value && value.trim() !== '' && value !== 'N/A' ? value : 'N/A';
  }

  // CSS class methods
  getContainerClasses(): string {
    return this.isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  }

  getCardClasses(): string {
    return this.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  }

  getInputClasses(): string {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200';
    return this.isDarkMode
      ? `${baseClasses} bg-gray-700 border-gray-600 text-white placeholder-gray-400`
      : `${baseClasses} bg-white border-gray-300 text-gray-900 placeholder-gray-500`;
  }

  getButtonClasses(type: 'primary' | 'secondary' | 'danger'): string {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 ';

    switch (type) {
      case 'primary':
        return base + 'bg-green-600 hover:bg-green-700 text-white';
      case 'secondary':
        return base + (this.isDarkMode
          ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300');
      case 'danger':
        return base + 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return base;
    }
  }

  // Change password methods
  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
    this.resetPasswordForm();
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
    this.resetPasswordForm();
  }

  resetPasswordForm(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordError = null;
    this.passwordSuccess = null;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  async changePassword(): Promise<void> {
    if (this.isChangingPassword) return;

    // Validate passwords
    if (!this.passwordData.currentPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
      this.passwordError = 'All password fields are required.';
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        this.passwordError = null;
      }, 5000);
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = 'New passwords do not match.';
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        this.passwordError = null;
      }, 5000);
      return;
    }

    if (this.passwordData.newPassword.length < 8) {
      this.passwordError = 'New password must be at least 8 characters long.';
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        this.passwordError = null;
      }, 5000);
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: this.passwordData.currentPassword,
          newPassword: this.passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
        const errorMessage = data.message || 'Failed to change password. Please try again.';
        this.passwordError = errorMessage;
        this.toastService.error(errorMessage);
        
        // Auto-dismiss error message after 5 seconds
        setTimeout(() => {
          this.passwordError = null;
        }, 5000);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      const errorMessage = 'An error occurred while changing password. Please try again.';
      this.passwordError = errorMessage;
      this.toastService.error(errorMessage);
      
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => {
        this.passwordError = null;
      }, 5000);
    } finally {
      this.isChangingPassword = false;
    }
  }
}
