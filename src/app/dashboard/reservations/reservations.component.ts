import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

interface Student {
  id: string;
  name: string;
}

interface Book {
  title: string;
  author: string;
}

interface Reservation {
  id: string;
  student: Student;
  book: Book;
  reservedDate: string;
  holdUntil: string;
  priority: 'High' | 'Normal' | 'Low';
  status: 'Pending' | 'Active' | 'Ready' | 'Expired' | 'Fulfilled';
}

interface ReservationStats {
  activeReservations: number;
  readyForPickup: number;
  expiredHolds: number;
  fulfilledToday: number;
}

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.css']
})
export class ReservationsComponent implements OnInit {

  stats: ReservationStats = {
    activeReservations: 0,
    readyForPickup: 0,
    expiredHolds: 0,
    fulfilledToday: 0
  };

  // All reservations data
  allReservations: Reservation[] = [];
  reservations: Reservation[] = [];

  // Loading states
  isLoading: boolean = false;
  error: string | null = null;


  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalReservations: number = 0;
  
  // Filter properties
  selectedStatus: string = '';
  selectedPriority: string = '';
  searchTerm: string = '';
  
  // Sorting properties
  sortColumn: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal properties
  showFulfillModal: boolean = false;
  showRejectModal: boolean = false;
  selectedReservationId: string | null = null;
  isProcessingFulfill: boolean = false;
  isProcessingReject: boolean = false;
  rejectReason: string = '';

  constructor(
    private themeService: ThemeService,
    private apiService: ApiService,
    private toastService: ToastService
  ) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    this.loadReservations();
  }

  // Load reservations from API
  loadReservations(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.get('/borrowing/reservations').subscribe({
      next: (response: any) => {
        if (response.success) {
          this.allReservations = response.data;
          this.updateStats();
          this.applyFiltersAndSort();
          console.log('✅ Reservations loaded successfully:', response.data);
        } else {
          this.error = 'Failed to load reservations';
          console.error('❌ Failed to load reservations:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load reservations';
        this.isLoading = false;
        console.error('❌ Error loading reservations:', error);
      }
    });
  }

  // Update statistics based on current reservations
  updateStats(): void {
    this.stats = {
      activeReservations: this.allReservations.filter(r => r.status === 'Active').length,
      readyForPickup: this.allReservations.filter(r => r.status === 'Ready').length,
      expiredHolds: this.allReservations.filter(r => r.status === 'Expired').length,
      fulfilledToday: this.allReservations.filter(r => {
        const today = new Date().toISOString().split('T')[0];
        return r.status === 'Fulfilled' && r.reservedDate === today;
      }).length
    };
  }

  // Show fulfill confirmation modal
  fulfillReservation(reservationId: string): void {
    this.selectedReservationId = reservationId;
    this.showFulfillModal = true;
  }

  // Confirm fulfill reservation
  confirmFulfillReservation(): void {
    if (!this.selectedReservationId || this.isProcessingFulfill) return;

    this.isProcessingFulfill = true;

    this.apiService.post(`/borrowing/fulfill-reservation/${this.selectedReservationId}`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('✅ Reservation fulfilled successfully:', response);
          // Reload reservations to reflect changes
          this.loadReservations();
          this.toastService.success(
            'Reservation Fulfilled',
            `Book "${response.data.bookTitle}" is now borrowed with 2-day loan period.`
          );
        } else {
          console.error('❌ Failed to fulfill reservation:', response);
          this.toastService.error(
            'Fulfillment Failed',
            response.error || 'Failed to fulfill reservation. Please try again.'
          );
        }
        this.showFulfillModal = false;
        this.selectedReservationId = null;
        this.isProcessingFulfill = false;
      },
      error: (error) => {
        console.error('❌ Error fulfilling reservation:', error);
        this.toastService.error(
          'Fulfillment Failed',
          error.error?.error || 'Failed to fulfill reservation. Please try again.'
        );
        this.showFulfillModal = false;
        this.selectedReservationId = null;
        this.isProcessingFulfill = false;
      }
    });
  }

  // Cancel fulfill reservation
  cancelFulfillReservation(): void {
    this.showFulfillModal = false;
    this.selectedReservationId = null;
  }

  // Show reject confirmation modal
  rejectReservation(reservationId: string): void {
    this.selectedReservationId = reservationId;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  // Confirm reject reservation
  confirmRejectReservation(): void {
    if (!this.selectedReservationId || this.isProcessingReject) return;

    if (!this.rejectReason.trim()) {
      this.toastService.warning('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    this.isProcessingReject = true;

    this.apiService.post(`/borrowing/reject-reservation/${this.selectedReservationId}`, {
      reason: this.rejectReason.trim()
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('✅ Reservation rejected successfully:', response);
          // Reload reservations to reflect changes
          this.loadReservations();
          this.toastService.success(
            'Reservation Rejected',
            'Student has been notified of the rejection.'
          );
        } else {
          console.error('❌ Failed to reject reservation:', response);
          this.toastService.error(
            'Rejection Failed',
            response.error || 'Failed to reject reservation. Please try again.'
          );
        }
        this.showRejectModal = false;
        this.selectedReservationId = null;
        this.rejectReason = '';
        this.isProcessingReject = false;
      },
      error: (error) => {
        console.error('❌ Error rejecting reservation:', error);
        this.toastService.error(
          'Rejection Failed',
          error.error?.error || 'Failed to reject reservation. Please try again.'
        );
        this.showRejectModal = false;
        this.selectedReservationId = null;
        this.rejectReason = '';
        this.isProcessingReject = false;
      }
    });
  }

  // Cancel reject reservation
  cancelRejectReservation(): void {
    this.showRejectModal = false;
    this.selectedReservationId = null;
    this.rejectReason = '';
  }

  // Send notification to student (this is what the notify button does)
  notifyStudent(reservationId: string): void {
    this.apiService.post(`/borrowing/notify-reservation/${reservationId}`, {}).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success(
            'Notification Sent',
            'Student has been notified about their reservation status.'
          );
        } else {
          this.toastService.error(
            'Notification Failed',
            'Failed to send notification. Please try again.'
          );
        }
      },
      error: (error) => {
        console.error('❌ Error sending notification:', error);
        this.toastService.error(
          'Notification Failed',
          'Failed to send notification. Please try again.'
        );
      }
    });
  }

  // Notify user about reservation
  notifyUser(reservationId: string): void {
    // This would typically send a notification to the user
    alert('Notification sent to user about their reservation.');
  }

  // Cancel reservation
  cancelReservation(reservationId: string): void {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    // For now, we'll just remove it from the local array
    // In a real implementation, this would call an API endpoint
    this.allReservations = this.allReservations.filter(r => r.id !== reservationId);
    this.updateStats();
    this.applyFiltersAndSort();
    alert('Reservation cancelled successfully.');
  }

  getTextClasses(): string {
    return this.isDarkMode ? 'text-white' : 'text-gray-900';
  }

  getSecondaryTextClasses(): string {
    return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
  }

  getInputClasses(): string {
    return this.isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900';
  }

  getCardClasses(): string {
    return this.isDarkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-gray-200 text-gray-900';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Ready':
        return 'bg-green-100 text-green-800';
      case 'Active':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Fulfilled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Normal':
        return 'bg-blue-100 text-blue-800';
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Apply filters and sorting
  private applyFiltersAndSort(): void {
    let filtered = [...this.allReservations];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(reservation =>
        reservation.student.name.toLowerCase().includes(term) ||
        reservation.book.title.toLowerCase().includes(term) ||
        reservation.book.author.toLowerCase().includes(term) ||
        reservation.id.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(reservation => reservation.status === this.selectedStatus);
    }

    // Apply priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(reservation => reservation.priority === this.selectedPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'student':
          aValue = a.student.name.toLowerCase();
          bValue = b.student.name.toLowerCase();
          break;
        case 'book':
          aValue = a.book.title.toLowerCase();
          bValue = b.book.title.toLowerCase();
          break;
        case 'reservedDate':
          aValue = new Date(a.reservedDate).getTime();
          bValue = new Date(b.reservedDate).getTime();
          break;
        case 'holdUntil':
          aValue = new Date(a.holdUntil).getTime();
          bValue = new Date(b.holdUntil).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.reservations = filtered;
    this.updatePagination();
  }
  
  // Update pagination
  private updatePagination(): void {
    this.totalReservations = this.reservations.length;
    this.totalPages = Math.ceil(this.totalReservations / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }
  
  // Get reservations for current page
  getPaginatedReservations(): Reservation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.reservations.slice(startIndex, endIndex);
  }
  
  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getDisplayRange(): string {
    if (this.totalReservations === 0) return '0 - 0 of 0';

    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalReservations);

    return `${start} - ${end} of ${this.totalReservations}`;
  }

  onItemsPerPageChange(): void {
    // Reset to first page when changing items per page
    this.currentPage = 1;
    this.updatePagination();
  }
  
  // Filter change handler
  onFilterChange(): void {
    this.applyFiltersAndSort();
  }
  
  // Search functionality
  onSearch(): void {
    this.applyFiltersAndSort();
  }
  
  // Sort functionality
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }
}
