import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentAuthService } from '../services/student-auth.service';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../components/toast/toast.component';

interface StudentProfileData {
  firstName: string;
  lastName: string;
  middleInitial: string;
  suffix: string;
  studentId: string;
  course: string;
  yearLevel: string;
  section: string;
  email: string;
  phoneNumber: string;
  profilePhoto?: string;
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent implements OnInit {
  isDarkMode: boolean = false;
  isEditing: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  
  profileData: StudentProfileData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    studentId: '',
    course: '',
    yearLevel: '',
    section: '',
    email: '',
    phoneNumber: '',
    profilePhoto: ''
  };

  originalProfileData: StudentProfileData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    suffix: '',
    studentId: '',
    course: '',
    yearLevel: '',
    section: '',
    email: '',
    phoneNumber: '',
    profilePhoto: ''
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Upload modal states
  showUploadModal = false;
  isUploading = false;
  uploadProgress = 0;
  uploadSuccess = false;
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
    private studentAuthService: StudentAuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadDarkModePreference();
    this.loadProfileData();
  }

  private loadDarkModePreference(): void {
    const savedPreference = localStorage.getItem('darkMode');
    this.isDarkMode = savedPreference === 'true';
  }

  private loadProfileData(): void {
    this.isLoading = true;

    // Get detailed student profile from auth service
    this.studentAuthService.getDetailedProfile().subscribe({
      next: (detailedStudent) => {
        if (detailedStudent) {
          this.profileData = {
            firstName: detailedStudent.firstName,
            lastName: detailedStudent.lastName,
            middleInitial: detailedStudent.middleInitial || '',
            suffix: detailedStudent.suffix || '',
            studentId: detailedStudent.studentId,
            course: detailedStudent.course,
            yearLevel: detailedStudent.yearLevel,
            section: detailedStudent.section,
            email: detailedStudent.email,
            phoneNumber: detailedStudent.phoneNumber || '',
            profilePhoto: detailedStudent.profilePhoto || this.getDefaultProfilePhoto(detailedStudent.firstName)
          };

          console.log('Profile data loaded:', this.profileData);
          console.log('Profile photo URL:', this.profileData.profilePhoto);

          // Test if the image URL is accessible
          if (this.profileData.profilePhoto && this.profileData.profilePhoto !== this.getDefaultProfilePhoto(this.profileData.firstName)) {
            console.log('🧪 Testing image URL accessibility...');
            const testImg = new Image();
            testImg.onload = () => console.log('✅ Image URL is accessible');
            testImg.onerror = () => console.error('❌ Image URL is NOT accessible');
            testImg.src = this.profileData.profilePhoto;
          }

          // Store original data for reset functionality
          this.originalProfileData = { ...this.profileData };
        } else {
          console.error('Failed to load detailed student profile');
          // Fallback to basic student data if detailed profile fails
          this.loadBasicProfileData();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading detailed student profile:', error);
        // Fallback to basic student data on error
        this.loadBasicProfileData();
        this.isLoading = false;
      }
    });
  }

  private loadBasicProfileData(): void {
    // Fallback method using basic student data
    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (currentStudent) {
      // Parse the full name to get individual components
      const nameParts = currentStudent.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      this.profileData = {
        firstName: firstName,
        lastName: lastName,
        middleInitial: '',
        suffix: '',
        studentId: currentStudent.studentId,
        course: currentStudent.course,
        yearLevel: currentStudent.yearLevel,
        section: currentStudent.section,
        email: currentStudent.email,
        phoneNumber: currentStudent.phoneNumber || '',
        profilePhoto: this.getDefaultProfilePhoto(firstName)
      };

      // Store original data for reset functionality
      this.originalProfileData = { ...this.profileData };
    }
  }

  getDefaultProfilePhoto(firstName: string): string {
    const initial = firstName.charAt(0).toUpperCase() || 'S';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%233B82F6'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastService.error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.toastService.error('File size must be less than 5MB.');
        return;
      }

      this.selectedFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);

      // Show upload modal
      this.showUploadModal = true;
      this.resetUploadState();
    }
  }

  uploadPhoto(): void {
    this.uploadProfilePhoto();
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

    // Handle profile photo upload first if there's a new file
    if (this.selectedFile) {
      this.uploadProfilePhoto();
    } else {
      // No new photo, just update profile data
      this.updateProfileData();
    }
  }

  uploadProfilePhoto(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = null;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 20;
      }
    }, 200);

    this.studentAuthService.uploadProfilePhoto(this.selectedFile).subscribe({
      next: (imageUrl) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;

        console.log('Upload completed with imageUrl:', imageUrl); // Debug log
        console.log('Current profileData.profilePhoto:', this.profileData.profilePhoto); // Debug log

        if (imageUrl) {
          // Convert relative URL to full URL if needed
          let fullImageUrl = imageUrl;
          if (imageUrl.startsWith('/api/')) {
            fullImageUrl = `http://localhost:3000${imageUrl}`;
          }

          // Store the clean URL without cache-busting parameter
          this.profileData.profilePhoto = fullImageUrl;
          this.uploadSuccess = true;
          this.toastService.success('Profile photo uploaded successfully!');

          // Force refresh the profile photo display
          this.previewUrl = null;

          setTimeout(() => {
            this.updateProfileData();
            // Close modal after successful upload and update
            setTimeout(() => {
              this.closeUploadModal();
            }, 500);
          }, 1000); // Show success for 1 second before continuing
        } else {
          console.error('Upload returned null imageUrl'); // Debug log
          this.uploadError = 'Upload completed but no image URL received';
          this.toastService.error('Upload completed but no image URL received');
          this.isUploading = false;
          this.isSaving = false;
        }
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('Profile photo upload error:', error);
        this.uploadError = error.message || 'Failed to upload profile photo. Please try again.';
        this.toastService.error(this.uploadError || 'Upload failed');
        this.isUploading = false;
        this.isSaving = false;
      }
    });
  }

  private updateProfileData(): void {
    // Prepare detailed profile update data
    const updateData = {
      firstName: this.profileData.firstName,
      lastName: this.profileData.lastName,
      middleInitial: this.profileData.middleInitial,
      suffix: this.profileData.suffix,
      email: this.profileData.email,
      phoneNumber: this.profileData.phoneNumber,
      course: this.profileData.course,
      yearLevel: this.profileData.yearLevel,
      section: this.profileData.section,
      profilePhoto: this.profileData.profilePhoto
    };

    // Update profile using detailed student auth service method
    this.studentAuthService.updateDetailedProfile(updateData).subscribe({
      next: (success) => {
        if (success) {
          // Update original data
          this.originalProfileData = { ...this.profileData };

          this.isSaving = false;
          this.isEditing = false;
          this.selectedFile = null;
          this.previewUrl = null;
          this.showUploadModal = false;

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

  // Upload modal methods
  resetUploadState(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = null;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.resetUploadState();
    this.selectedFile = null;
    this.previewUrl = null;
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
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.isChangingPassword = false;
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

    try {
      const token = localStorage.getItem('studentToken');
      console.log('Token:', token); // Debug log
      console.log('Current Password:', this.passwordData.currentPassword); // Debug log
      console.log('New Password:', this.passwordData.newPassword); // Debug log

      const response = await fetch('http://localhost:3000/api/v1/auth/change-password', {
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
      console.log('Response:', response.status, result); // Debug log

      if (response.ok) {
        this.toastService.success('Password changed successfully!');
        this.closeChangePasswordModal();
      } else {
        this.toastService.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      this.toastService.error('An error occurred while changing password');
    } finally {
      this.isChangingPassword = false;
    }
  }

  confirmUpload(): void {
    if (this.selectedFile) {
      this.uploadProfilePhoto();
    }
  }

  showUploadError(message: string): void {
    this.uploadError = message;
    this.toastService.error(message);
    setTimeout(() => {
      this.uploadError = null;
    }, 5000);
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
    this.router.navigate(['/student-dashboard']);
  }

  // Utility methods for styling
  getContainerClasses(): string {
    return this.isDarkMode 
      ? 'min-h-screen bg-gray-900 text-white' 
      : 'min-h-screen bg-gray-50 text-gray-900';
  }

  getCardClasses(): string {
    return this.isDarkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-gray-200 text-gray-900';
  }

  getInputClasses(): string {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200';
    return this.isDarkMode 
      ? `${baseClasses} bg-gray-700 border-gray-600 text-white placeholder-gray-400` 
      : `${baseClasses} bg-white border-gray-300 text-gray-900 placeholder-gray-500`;
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

  onImageError(event: any): void {
    console.error('❌ Image failed to load:', event.target.src);
    console.log('Current profileData.profilePhoto:', this.profileData.profilePhoto);
    console.log('Current previewUrl:', this.previewUrl);

    // Try loading the image without cache busting parameter first
    const originalSrc = event.target.src;
    if (originalSrc.includes('?t=')) {
      console.log('🔄 Retrying without cache parameter...');
      const srcWithoutCache = originalSrc.split('?')[0];
      event.target.src = srcWithoutCache;
      return;
    }

    // Try loading with a different approach
    if (originalSrc.startsWith('http://localhost:3000/')) {
      console.log('🔄 Retrying with relative path...');
      const relativePath = originalSrc.replace('http://localhost:3000/', '/');
      event.target.src = relativePath;
      return;
    }

    console.log('Falling back to default profile photo');
    // Fallback to default profile photo with initials
    event.target.src = this.getDefaultProfilePhoto(this.profileData.firstName);
  }

  onImageLoad(event: any): void {
    console.log('Image loaded successfully:', event.target.src);
  }

  hasValidProfilePhoto(): boolean {
    const photoUrl = this.previewUrl || this.profileData.profilePhoto;
    const isValid = Boolean(photoUrl &&
                   photoUrl.trim() !== '' &&
                   !photoUrl.includes('data:image/svg+xml') && // Not the default SVG
                   (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/')));

    console.log('🔍 Checking profile photo validity:', {
      photoUrl,
      isValid,
      previewUrl: this.previewUrl,
      profilePhoto: this.profileData.profilePhoto
    });

    return isValid;
  }

  // Add a method to get the safe image URL
  getSafeImageUrl(): string {
    const photoUrl = this.previewUrl || this.profileData.profilePhoto;
    if (this.hasValidProfilePhoto() && photoUrl) {
      let imageUrl = photoUrl;

      // Convert relative URLs to full backend URLs
      if (imageUrl.startsWith('/api/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
        console.log('📸 Using full backend URL:', imageUrl);
      } else {
        console.log('📸 Using profile photo URL:', imageUrl);
      }

      return imageUrl;
    }
    console.log('📸 Using default profile photo for:', this.profileData.firstName);
    return this.getDefaultProfilePhoto(this.profileData.firstName);
  }


}
