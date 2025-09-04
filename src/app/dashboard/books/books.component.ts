import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { CsvService } from '../../services/csv.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { AuthService } from '../../services/auth.service';
import { ArchivedBooksService } from '../../services/archived-books.service';

interface Book {
  BookID?: number;
  Title: string;
  Author: string;
  ISBN: string;
  Category: string;
  Subject: string;
  PublishedYear?: number;
  CopyrightYear?: number;
  Publisher: string;
  CallNumber: string;
  DeweyDecimal: string;
  Copies: number;
  Remarks?: string;
  Status: 'Available' | 'Borrowed' | 'Lost' | 'Damaged';
  ShelfLocation: string;
  AcquisitionDate?: string;
}

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  showAddBookModal: boolean = false;
  showViewBookModal: boolean = false;
  showEditBookModal: boolean = false;
  showDeleteConfirmModal: boolean = false;
  showBookSummaryModal: boolean = false;
  showImportCsvModal: boolean = false;
  showArchiveModal: boolean = false;
  isSubmitting: boolean = false;
  isRefreshing: boolean = false;
  archiveFormSubmitted: boolean = false;

  // CSV related properties
  csvFile: File | null = null;
  csvData: any[] = [];
  csvValidationResults: { valid: any[], invalid: any[] } = { valid: [], invalid: [] };
  csvImportStep: 'upload' | 'validate' | 'import' = 'upload';
  csvImportProgress: number = 0;
  isDragOver: boolean = false;

  // Selected book for view/edit/delete operations
  selectedBook: Book | null = null;

  newBook: Book = {
    Title: '',
    Author: '',
    ISBN: '',
    Category: '',
    Subject: '',
    PublishedYear: undefined,
    CopyrightYear: undefined,
    Publisher: '',
    CallNumber: '',
    DeweyDecimal: '',
    Copies: 1,
    Remarks: '',
    Status: 'Available',
    ShelfLocation: '',
    AcquisitionDate: ''
  };

  editBookData: Book = {
    Title: '',
    Author: '',
    ISBN: '',
    Category: '',
    Subject: '',
    PublishedYear: undefined,
    CopyrightYear: undefined,
    Publisher: '',
    CallNumber: '',
    DeweyDecimal: '',
    Copies: 1,
    Remarks: '',
    Status: 'Available',
    ShelfLocation: '',
    AcquisitionDate: ''
  };

  archiveData = {
    reason: '',
    notes: ''
  };

  books: Book[] = [];
  allBooks: Book[] = [];
  filteredBooks: Book[] = []; // For client-side filtering

  // Search and Filter properties
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  selectedSubject: string = '';
  
  // Sorting properties
  sortColumn: string = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10; // Increased from 5 to 10 books per page
  totalPages: number = 0;
  totalBooks: number = 0;

  constructor(
    private apiService: ApiService,
    private themeService: ThemeService,
    private csvService: CsvService,
    private toastService: ToastService,
    private authService: AuthService,
    private archivedBooksService: ArchivedBooksService
  ) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    // Load books from API
    this.loadBooks();
  }

  loadBooks(): void {
    // For search functionality, we'll load all books
    // Add a high limit to get all books from the paginated API
    this.apiService.get('/books/get-all-books?limit=10000').subscribe({
      next: (response: any) => {
        console.log('📥 API Response:', response);
        if (response.success) {
          this.allBooks = response.books || [];
          this.applyFiltersAndSort();
          console.log('✅ Books loaded:', this.allBooks.length, 'total books');
        }
      },
      error: (error) => {
        console.error('❌ Error loading books:', error);
        this.allBooks = [];
        this.books = [];
        this.totalBooks = 0;
        this.totalPages = 0;
        this.toastService.error('Failed to load books from database');
      }
    });
  }

  updateDisplayedBooks(): void {
    // No longer needed since we're using client-side filtering
    // The books array is already filtered and paginated in applyFiltersAndSort
    console.log('📄 updateDisplayedBooks called - using client-side filtering');
  }

  // Search functionality
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFiltersAndSort();
  }

  // Filter change handler
  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
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

  // Apply filters and sorting
  private applyFiltersAndSort(): void {
    let filtered = [...this.allBooks];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(book =>
        book.Title?.toLowerCase().includes(term) ||
        book.Author?.toLowerCase().includes(term) ||
        book.ISBN?.toLowerCase().includes(term) ||
        book.Publisher?.toLowerCase().includes(term) ||
        book.CallNumber?.toLowerCase().includes(term) ||
        book.DeweyDecimal?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(book => book.Category === this.selectedCategory);
    }

    // Apply subject filter
    if (this.selectedSubject) {
      filtered = filtered.filter(book => book.Subject === this.selectedSubject);
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(book => book.Status === this.selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'title':
          aValue = (a.Title || '').toLowerCase();
          bValue = (b.Title || '').toLowerCase();
          break;
        case 'author':
          aValue = (a.Author || '').toLowerCase();
          bValue = (b.Author || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.Category || '').toLowerCase();
          bValue = (b.Category || '').toLowerCase();
          break;
        case 'status':
          aValue = a.Status || '';
          bValue = b.Status || '';
          break;
        case 'publishedYear':
          aValue = a.PublishedYear || 0;
          bValue = b.PublishedYear || 0;
          break;
        default:
          aValue = (a.Title || '').toLowerCase();
          bValue = (b.Title || '').toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredBooks = filtered;
    this.updatePagination();
  }

  // Update pagination based on filtered results
  private updatePagination(): void {
    this.totalBooks = this.filteredBooks.length;
    this.totalPages = Math.ceil(this.totalBooks / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    // Get books for current page
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.books = this.filteredBooks.slice(startIndex, endIndex);
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

  // Get unique categories for filter dropdown
  getUniqueCategories(): string[] {
    const categories = [...new Set(this.allBooks.map(book => book.Category).filter(cat => cat && cat.trim()))];
    return categories.sort();
  }

  // Get unique subjects for filter dropdown
  getUniqueSubjects(): string[] {
    const subjects = [...new Set(this.allBooks.map(book => book.Subject).filter(subj => subj && subj.trim()))];
    return subjects.sort();
  }

  // Get unique statuses for filter dropdown
  getUniqueStatuses(): string[] {
    const statuses = [...new Set(this.allBooks.map(book => book.Status).filter(status => status))];
    return statuses.sort();
  }

  // Pagination helper methods
  getDisplayRange(): string {
    if (this.totalBooks === 0) return '0 books';
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalBooks);
    return `${start}-${end} of ${this.totalBooks}`;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5; // Show maximum 5 page numbers
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Enhanced refresh functionality
  refreshBooks(): void {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    console.log('🔄 Refreshing books data...');
    
    this.apiService.get('/books/get-all-books?limit=10000').subscribe({
      next: (response: any) => {
        console.log('📥 Refresh API Response:', response);
        if (response.success) {
          this.allBooks = response.books || [];
          this.applyFiltersAndSort();
          console.log('✅ Books refreshed:', this.allBooks.length, 'total books');
          this.toastService.success(`Books refreshed successfully! ${this.allBooks.length} books loaded.`);
        }
        this.isRefreshing = false;
      },
      error: (error) => {
        console.error('❌ Error refreshing books:', error);
        this.toastService.error('Failed to refresh books data');
        this.isRefreshing = false;
      }
    });
  }

  openAddBookModal(): void {
    this.showAddBookModal = true;
    this.resetNewBook();
  }

  closeAddBookModal(): void {
    this.showAddBookModal = false;
    this.resetNewBook();
  }

  resetNewBook(): void {
    this.newBook = {
      Title: '',
      Author: '',
      ISBN: '',
      Category: '',
      Subject: '',
      PublishedYear: undefined,
      CopyrightYear: undefined,
      Publisher: '',
      CallNumber: '',
      DeweyDecimal: '',
      Copies: 1,
      Remarks: '',
      Status: 'Available',
      ShelfLocation: '',
      AcquisitionDate: ''
    };
  }

  onSubmitBook(): void {
    if (this.isSubmitting) return;

    // Validate required fields
    if (!this.newBook.Title || !this.newBook.ISBN) {
      this.isSubmitting = true; // Set to true to show validation errors
      setTimeout(() => {
        this.isSubmitting = false; // Reset after showing errors
      }, 100);
      return;
    }

    this.isSubmitting = true;

    // Prepare the book data for API (using PascalCase as expected by backend)
    const bookData = {
      Title: this.newBook.Title,
      Author: this.newBook.Author || null,
      ISBN: this.newBook.ISBN,
      Category: this.newBook.Category || null,
      Subject: this.newBook.Subject || null,
      PublishedYear: this.newBook.PublishedYear || null,
      CopyrightYear: this.newBook.CopyrightYear || null,
      Publisher: this.newBook.Publisher || null,
      CallNumber: this.newBook.CallNumber || null,
      DeweyDecimal: this.newBook.DeweyDecimal || null,
      Copies: this.newBook.Copies || 1,
      Remarks: this.newBook.Remarks || null,
      Status: this.newBook.Status,
      ShelfLocation: this.newBook.ShelfLocation || null,
      AcquisitionDate: this.newBook.AcquisitionDate || null
    };

    console.log('📤 Sending book data to API:', bookData);

    // Call API to add book
    this.apiService.post('/books/add-book', bookData).subscribe({
      next: (response: any) => {
        console.log('✅ Book added successfully:', response);
        this.isSubmitting = false;
        this.closeAddBookModal();
        // Refresh books list to show the new book
        this.loadBooks();
        this.toastService.success('Book added successfully!');
      },
      error: (error) => {
        console.error('❌ Error adding book:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        this.isSubmitting = false;

        // Handle different types of errors
        let errorMessage = 'Error adding book. Please try again.';

        if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.details && error.error.details.length > 0) {
          errorMessage = error.error.details[0].msg;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.toastService.error(errorMessage);
      }
    });
  }

  addNewBook(): void {
    this.openAddBookModal();
  }

  viewBook(bookId: number | undefined): void {
    if (bookId) {
      const book = this.books.find(b => b.BookID === bookId);
      if (book) {
        this.selectedBook = book;
        this.showViewBookModal = true;
      }
    }
  }

  editBook(bookId: number | undefined): void {
    if (bookId) {
      const book = this.books.find(b => b.BookID === bookId);
      if (book) {
        this.selectedBook = book;
        // Copy book data to editBookData for editing
        this.editBookData = { ...book };
        this.showEditBookModal = true;
      }
    }
  }

  deleteBook(bookId: number | undefined): void {
    if (bookId) {
      const book = this.books.find(b => b.BookID === bookId);
      if (book) {
        this.selectedBook = book;
        this.showDeleteConfirmModal = true;
      }
    }
  }

  // Pagination methods (already defined above, removing duplicates)
  // goToPage, previousPage, nextPage, getPageNumbers are already implemented above

  onItemsPerPageChange(): void {
    // Reset to first page when changing items per page
    this.currentPage = 1;
    // Use client-side filtering instead of server reload
    this.updatePagination();
    console.log('📄 Items per page changed to:', this.itemsPerPage);
  }

  addTestBooks(): void {
    const testBooks = [
      {
        Title: 'Introduction to Computer Science',
        Author: 'John Smith',
        ISBN: '978-0123456789',
        Category: 'Computer Science',
        Subject: 'Programming',
        PublishedYear: 2023,
        CopyrightYear: 2023,
        Publisher: 'Tech Books Publishing',
        CallNumber: 'CS101',
        DeweyDecimal: '004.1',
        Copies: 5,
        Remarks: 'Latest edition with updated content',
        Status: 'Available',
        ShelfLocation: 'A-1-001',
        AcquisitionDate: '2024-01-15'
      },
      {
        Title: 'Advanced Mathematics',
        Author: 'Jane Doe',
        ISBN: '978-0987654321',
        Category: 'Mathematics',
        Subject: 'Calculus',
        PublishedYear: 2022,
        CopyrightYear: 2022,
        Publisher: 'Academic Press',
        CallNumber: 'MATH201',
        DeweyDecimal: '515.1',
        Copies: 3,
        Remarks: 'Comprehensive calculus textbook',
        Status: 'Available',
        ShelfLocation: 'B-2-015',
        AcquisitionDate: '2024-01-20'
      },
      {
        Title: 'World History Encyclopedia',
        Author: 'Robert Johnson',
        ISBN: '978-0456789123',
        Category: 'History',
        Subject: 'World History',
        PublishedYear: 2021,
        CopyrightYear: 2021,
        Publisher: 'Historical Publications',
        CallNumber: 'HIST301',
        DeweyDecimal: '909.1',
        Copies: 2,
        Remarks: 'Complete world history reference',
        Status: 'Available',
        ShelfLocation: 'C-3-025',
        AcquisitionDate: '2024-02-01'
      }
    ];

    // Add each test book
    let addedCount = 0;
    testBooks.forEach((book, index) => {
      setTimeout(() => {
        this.apiService.post('/books/add-book', book).subscribe({
          next: (response: any) => {
            addedCount++;
            console.log(`✅ Test book ${addedCount} added:`, book.Title);
            if (addedCount === testBooks.length) {
              // Refresh the books list after all test books are added
              this.loadBooks();
              this.toastService.success(`${testBooks.length} test books added successfully!`);
            }
          },
          error: (error) => {
            console.error('❌ Error adding test book:', error);
          }
        });
      }, index * 500); // Stagger the requests by 500ms each
    });
  }

  // Modal control methods
  closeViewBookModal(): void {
    this.showViewBookModal = false;
    this.selectedBook = null;
  }

  closeEditBookModal(): void {
    this.showEditBookModal = false;
    this.selectedBook = null;
    this.resetEditBook();
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.selectedBook = null;
  }

  // Book Summary modal methods
  openBookSummaryModal(): void {
    this.showBookSummaryModal = true;
  }

  closeBookSummaryModal(): void {
    this.showBookSummaryModal = false;
  }

  // Get book statistics for summary
  getBookStats() {
    const totalBooks = this.totalBooks;
    const availableBooks = this.books.filter(book => book.Status === 'Available').length;
    const borrowedBooks = this.books.filter(book => book.Status === 'Borrowed').length;
    const lostBooks = this.books.filter(book => book.Status === 'Lost').length;
    const damagedBooks = this.books.filter(book => book.Status === 'Damaged').length;

    // Get category distribution
    const categoryStats = this.books.reduce((acc: any, book) => {
      const category = book.Category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBooks,
      availableBooks,
      borrowedBooks,
      lostBooks,
      damagedBooks,
      categoryStats
    };
  }

  // Helper method to access Object.keys in template
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  resetEditBook(): void {
    this.editBookData = {
      Title: '',
      Author: '',
      ISBN: '',
      Category: '',
      Subject: '',
      PublishedYear: undefined,
      CopyrightYear: undefined,
      Publisher: '',
      CallNumber: '',
      DeweyDecimal: '',
      Copies: 1,
      Remarks: '',
      Status: 'Available',
      ShelfLocation: '',
      AcquisitionDate: ''
    };
  }

  // Update book method
  onUpdateBook(): void {
    console.log('🔄 onUpdateBook called');
    console.log('📋 isSubmitting:', this.isSubmitting);
    console.log('📋 selectedBook:', this.selectedBook);
    console.log('📋 editBookData:', this.editBookData);

    if (this.isSubmitting || !this.selectedBook) {
      console.log('❌ Early return - isSubmitting or no selectedBook');
      return;
    }

    // Validate required fields
    if (!this.editBookData.Title || !this.editBookData.ISBN) {
      console.log('❌ Validation failed - missing Title or ISBN');
      console.log('📋 Title:', this.editBookData.Title);
      console.log('📋 ISBN:', this.editBookData.ISBN);
      this.isSubmitting = true;
      setTimeout(() => {
        this.isSubmitting = false;
      }, 100);
      return;
    }

    console.log('✅ Validation passed, proceeding with update');
    this.isSubmitting = true;

    // Prepare the book data for API (using PascalCase as expected by backend)
    const bookData = {
      Title: this.editBookData.Title,
      Author: this.editBookData.Author || null,
      ISBN: this.editBookData.ISBN,
      Category: this.editBookData.Category || null,
      Subject: this.editBookData.Subject || null,
      PublishedYear: this.editBookData.PublishedYear || null,
      CopyrightYear: this.editBookData.CopyrightYear || null,
      Publisher: this.editBookData.Publisher || null,
      CallNumber: this.editBookData.CallNumber || null,
      DeweyDecimal: this.editBookData.DeweyDecimal || null,
      Copies: this.editBookData.Copies || 1,
      Remarks: this.editBookData.Remarks || null,
      Status: this.editBookData.Status,
      ShelfLocation: this.editBookData.ShelfLocation || null,
      AcquisitionDate: this.editBookData.AcquisitionDate || null
    };

    console.log('📤 Updating book data:', bookData);
    console.log('📤 API endpoint:', `/books/update-book/${this.selectedBook.BookID}`);

    // Call API to update book
    this.apiService.put(`/books/update-book/${this.selectedBook.BookID}`, bookData).subscribe({
      next: (response: any) => {
        console.log('✅ Book updated successfully:', response);
        this.isSubmitting = false;
        this.closeEditBookModal();
        // Refresh books list to show the updated book
        this.loadBooks();
        this.toastService.success('Book updated successfully!');
      },
      error: (error) => {
        console.error('❌ Error updating book:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
        this.isSubmitting = false;

        // Handle different types of errors
        let errorMessage = 'Error updating book. Please try again.';

        if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.details && error.error.details.length > 0) {
          errorMessage = error.error.details[0].msg;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.toastService.error(errorMessage);
      }
    });
  }

  // Confirm delete method
  confirmDelete(): void {
    if (this.isSubmitting || !this.selectedBook) return;

    this.isSubmitting = true;

    console.log('🗑️ Deleting book:', this.selectedBook.BookID);

    // Call API to delete book
    this.apiService.delete(`/books/delete-book/${this.selectedBook.BookID}`).subscribe({
      next: (response: any) => {
        console.log('✅ Book deleted successfully:', response);
        this.isSubmitting = false;
        this.closeDeleteConfirmModal();
        // Refresh books list to remove the deleted book
        this.loadBooks();
        this.toastService.success('Book deleted successfully!');
      },
      error: (error) => {
        console.error('❌ Error deleting book:', error);
        this.isSubmitting = false;

        // Handle different types of errors
        let errorMessage = 'Error deleting book. Please try again.';

        if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.toastService.error(errorMessage);
      }
    });
  }

  // CSV Import/Export Methods
  openImportCsvModal(): void {
    this.showImportCsvModal = true;
    this.csvImportStep = 'upload';
    this.csvFile = null;
    this.csvData = [];
    this.csvValidationResults = { valid: [], invalid: [] };
  }

  closeImportCsvModal(): void {
    this.showImportCsvModal = false;
    this.csvImportStep = 'upload';
    this.csvFile = null;
    this.csvData = [];
    this.csvValidationResults = { valid: [], invalid: [] };
  }

  onCsvFileSelected(event: any): void {
    const file = event.target.files[0];
    this.handleFileSelection(file);
  }

  // Drag and drop event handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    if (!file) {
      this.toastService.error('No file selected');
      return;
    }

    // Check file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'csv') {
      this.toastService.error('Please select a CSV file (.csv extension required)');
      return;
    }

    // Check MIME type
    if (file.type && file.type !== 'text/csv' && file.type !== 'application/csv') {
      this.toastService.error('Please select a valid CSV file');
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      this.toastService.error('File size must be less than 10MB');
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      this.toastService.error('Selected file is empty');
      return;
    }

    this.csvFile = file;
    this.readCsvFile();
  }

  private readCsvFile(): void {
    if (!this.csvFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        
        if (!csvContent || csvContent.trim().length === 0) {
          this.toastService.error('CSV file is empty or could not be read');
          return;
        }

        // Check if file has content
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
          this.toastService.error('CSV file must contain at least a header row and one data row');
          return;
        }

        const headers = ['Title', 'Author', 'ISBN', 'Category', 'Subject', 'PublishedYear', 'CopyrightYear', 'Publisher', 'CallNumber', 'DeweyDecimal', 'Copies', 'Remarks', 'Status', 'ShelfLocation', 'AcquisitionDate'];
        
        // Validate CSV headers (case-insensitive)
        const firstLine = lines[0].toLowerCase();
        const requiredHeaders = ['title', 'author', 'isbn'];
        const missingHeaders = requiredHeaders.filter(header => {
          // Check if header exists in any common format variations
          const variations = [
            header,
            header.charAt(0).toUpperCase() + header.slice(1), // Title
            header.toUpperCase(), // TITLE
            header.replace(/([A-Z])/g, '_$1').toLowerCase(), // title
            header.replace(/([A-Z])/g, '-$1').toLowerCase()  // title
          ];
          return !variations.some(variation => firstLine.includes(variation.toLowerCase()));
        });
        
        if (missingHeaders.length > 0) {
          this.toastService.error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        this.csvData = this.csvService.parseCsv(csvContent, headers);
        
        if (this.csvData.length === 0) {
          this.toastService.error('No valid data found in CSV file');
          return;
        }

        this.csvValidationResults = this.csvService.validateBookData(this.csvData);
        this.csvImportStep = 'validate';
        
        if (this.csvValidationResults.valid.length === 0 && this.csvValidationResults.invalid.length > 0) {
          this.toastService.warning('No valid books found in CSV file. Please check the validation errors.');
        }
      } catch (error) {
        console.error('Error reading CSV file:', error);
        this.toastService.error('Error reading CSV file. Please ensure it is properly formatted.');
      }
    };
    
    reader.onerror = () => {
      this.toastService.error('Error reading file. Please try again.');
    };
    
    reader.readAsText(this.csvFile);
  }

  importValidBooks(): void {
    if (this.csvValidationResults.valid.length === 0) {
      this.toastService.error('No valid books to import');
      return;
    }

    this.isSubmitting = true;
    this.csvImportStep = 'import'; // Set step to import
    this.csvImportProgress = 0;
    const validBooks = this.csvValidationResults.valid;
    let importedCount = 0;
    let errorCount = 0;

    // Import books one by one with progress tracking
    const importNext = (index: number) => {
      if (index >= validBooks.length) {
        this.isSubmitting = false;
        this.toastService.success(`Import completed! ${importedCount} books imported successfully.`);
        if (errorCount > 0) {
          this.toastService.warning(`${errorCount} books failed to import.`);
        }
        this.closeImportCsvModal();
        this.loadBooks(); // Refresh the list
        return;
      }

      const book = validBooks[index];
      this.csvImportProgress = Math.round(((index + 1) / validBooks.length) * 100);

      // Map CSV data to Book interface format
      const bookData = {
        Title: book.Title || book.title,
        Author: book.Author || book.author,
        ISBN: book.ISBN || book.isbn,
        Category: book.Category || book.category,
        Subject: book.Subject || book.subject,
        PublishedYear: book.PublishedYear || book.publicationYear,
        CopyrightYear: book.CopyrightYear || book.copyrightYear,
        Publisher: book.Publisher || book.publisher,
        CallNumber: book.CallNumber || book.callNumber,
        DeweyDecimal: book.DeweyDecimal || book.deweyDecimal,
        Copies: book.Copies || book.quantity || 1,
        Remarks: book.Remarks || book.description || '',
        Status: book.Status || 'Available',
        ShelfLocation: book.ShelfLocation || book.location || '',
        AcquisitionDate: book.AcquisitionDate || new Date().toISOString().split('T')[0]
      };

      this.apiService.post('/api/v1/books/add-book', bookData).subscribe({
        next: (response: any) => {
          if (response.success) {
            importedCount++;
          } else {
            errorCount++;
          }
          importNext(index + 1);
        },
        error: (error) => {
          console.error('Error importing book:', error);
          errorCount++;
          importNext(index + 1);
        }
      });
    };

    importNext(0);
  }

  exportToCsv(): void {
    if (this.books.length === 0) {
      this.toastService.warning('No books to export');
      return;
    }

    const headers = ['Title', 'Author', 'ISBN', 'Category', 'Subject', 'PublishedYear', 'CopyrightYear', 'Publisher', 'CallNumber', 'DeweyDecimal', 'Copies', 'Remarks', 'Status', 'ShelfLocation', 'AcquisitionDate'];
    const exportData = this.books.map(book => ({
      Title: book.Title,
      Author: book.Author,
      ISBN: book.ISBN,
      Category: book.Category,
      Subject: book.Subject,
      PublishedYear: book.PublishedYear,
      CopyrightYear: book.CopyrightYear,
      Publisher: book.Publisher,
      CallNumber: book.CallNumber,
      DeweyDecimal: book.DeweyDecimal,
      Copies: book.Copies,
      Remarks: book.Remarks,
      Status: book.Status,
      ShelfLocation: book.ShelfLocation,
      AcquisitionDate: book.AcquisitionDate
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    this.csvService.generateCsv(exportData, headers, `books_export_${timestamp}.csv`);
    this.toastService.success('Books exported successfully!');
  }

  downloadBookTemplate(): void {
    this.csvService.generateBookTemplate();
    this.toastService.info('Book CSV template downloaded!');
  }

  // Archive methods
  openArchiveModal(book: Book): void {
    this.selectedBook = book;
    this.showArchiveModal = true;
    this.archiveFormSubmitted = false;
    // Reset archive form data
    this.archiveData = {
      reason: '',
      notes: ''
    };
  }

  closeArchiveModal(): void {
    this.showArchiveModal = false;
    this.selectedBook = null;
    this.archiveFormSubmitted = false;
    this.archiveData = {
      reason: '',
      notes: ''
    };
  }

  confirmArchive(): void {
    this.archiveFormSubmitted = true;
    
    if (!this.archiveData.reason) {
      this.toastService.error('Please select an archive reason');
      return;
    }

    if (!this.selectedBook) {
      this.toastService.error('No book selected for archiving');
      return;
    }

    this.isSubmitting = true;

    // Simulate API call to archive the book
    setTimeout(() => {
      if (this.selectedBook) {
        const adminName = this.getCurrentAdmin()?.fullName || 'Admin User';
        
        // Add the book to archived books service
        this.archivedBooksService.addArchivedBook(
          this.selectedBook,
          this.archiveData.reason,
          this.archiveData.notes,
          adminName
        );

        console.log('Book archived and transferred to archived collection:', {
          book: this.selectedBook,
          reason: this.archiveData.reason,
          notes: this.archiveData.notes,
          archivedBy: adminName,
          archivedDate: new Date()
        });

        // Remove the book from the current books array
        this.books = this.books.filter(book => book.BookID !== this.selectedBook!.BookID);
        this.allBooks = this.allBooks.filter(book => book.BookID !== this.selectedBook!.BookID);
        this.totalBooks = this.books.length;

        this.toastService.success(`Book "${this.selectedBook.Title}" has been archived successfully`);
        this.closeArchiveModal();
      }
      this.isSubmitting = false;
    }, 1500);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentAdmin() {
    return this.authService.getCurrentAdmin();
  }
}
