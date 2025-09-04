import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { ToastComponent } from '../../components/toast/toast.component';
import { ArchivedBooksService, ArchivedBook } from '../../services/archived-books.service';
import { Subscription } from 'rxjs';

// ArchivedBook interface is now imported from the service

@Component({
  selector: 'app-archived-books',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './archived-books.component.html',
  styleUrls: ['./archived-books.component.css']
})
export class ArchivedBooksComponent implements OnInit, OnDestroy {
  // Archived books data from service
  archivedBooks: ArchivedBook[] = [];
  private archivedBooksSubscription?: Subscription;

  // Filter and search properties
  searchTerm: string = '';
  selectedArchiveReason: string = '';
  selectedCategory: string = '';
  
  // Sorting properties
  sortColumn: string = 'archivedDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Modal properties
  showViewModal: boolean = false;
  showRestoreModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedBook: ArchivedBook | null = null;
  
  // Loading state
  isRefreshing: boolean = false;

  constructor(
    private themeService: ThemeService,
    private archivedBooksService: ArchivedBooksService
  ) {}

  ngOnInit(): void {
    console.log('Archived Books component initialized');
    this.loadArchivedBooks();
  }

  ngOnDestroy(): void {
    if (this.archivedBooksSubscription) {
      this.archivedBooksSubscription.unsubscribe();
    }
  }

  private loadArchivedBooks(): void {
    this.archivedBooksSubscription = this.archivedBooksService.getArchivedBooks().subscribe(
      (books) => {
        this.archivedBooks = books;
        console.log('Archived books loaded:', books.length);
      }
    );
  }

  // Getter for dark mode state
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  // Statistics getters
  get totalArchived(): number {
    return this.archivedBooks.length;
  }

  get damagedBooks(): number {
    return this.archivedBooks.filter(book => book.archiveReason === 'Damaged').length;
  }

  get lostBooks(): number {
    return this.archivedBooks.filter(book => book.archiveReason === 'Lost').length;
  }

  get outdatedBooks(): number {
    return this.archivedBooks.filter(book => book.archiveReason === 'Outdated').length;
  }

  // Search and filter methods
  onSearch(): void {
    // Search functionality is handled by getFilteredBooks()
  }

  onFilterChange(): void {
    // Filter functionality is handled by getFilteredBooks()
  }

  getFilteredBooks(): ArchivedBook[] {
    let filtered = [...this.archivedBooks];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchLower) ||
        book.author.toLowerCase().includes(searchLower) ||
        book.isbn.toLowerCase().includes(searchLower) ||
        (book.callNumber && book.callNumber.toLowerCase().includes(searchLower))
      );
    }

    // Apply archive reason filter
    if (this.selectedArchiveReason) {
      filtered = filtered.filter(book => book.archiveReason === this.selectedArchiveReason);
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(book => book.category === this.selectedCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'archiveReason':
          aValue = a.archiveReason;
          bValue = b.archiveReason;
          break;
        case 'archivedDate':
          aValue = new Date(a.archivedDate).getTime();
          bValue = new Date(b.archivedDate).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }

  getUniqueCategories(): string[] {
    const categories = [...new Set(this.archivedBooks.map(book => book.category))];
    return categories.sort();
  }

  // Sorting methods
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  // Action methods
  refreshArchivedBooks(): void {
    this.isRefreshing = true;
    // Simulate API call
    setTimeout(() => {
      this.isRefreshing = false;
      console.log('Archived books refreshed');
    }, 1500);
  }

  exportToCsv(): void {
    const csvData = this.getFilteredBooks().map(book => ({
      'Title': book.title,
      'Author': book.author,
      'ISBN': book.isbn,
      'Category': book.category,
      'Subject': book.subject || '',
      'Call Number': book.callNumber || '',
      'Archive Reason': book.archiveReason,
      'Archive Notes': book.archiveNotes || '',
      'Archived Date': book.archivedDate.toLocaleDateString(),
      'Archived By': book.archivedBy
    }));

    const csvContent = this.convertToCSV(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `archived_books_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Modal methods
  viewArchivedBook(book: ArchivedBook): void {
    this.selectedBook = book;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedBook = null;
  }

  restoreBook(book: ArchivedBook): void {
    this.selectedBook = book;
    this.showRestoreModal = true;
  }

  closeRestoreModal(): void {
    this.showRestoreModal = false;
    this.selectedBook = null;
  }

  confirmRestore(): void {
    if (this.selectedBook) {
      console.log('Restoring book:', this.selectedBook.title);
      // Use the service to restore the book
      this.archivedBooksService.restoreBook(this.selectedBook.id);
      this.closeRestoreModal();
    }
  }

  permanentlyDeleteBook(book: ArchivedBook): void {
    this.selectedBook = book;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedBook = null;
  }

  confirmDelete(): void {
    if (this.selectedBook) {
      console.log('Permanently deleting book:', this.selectedBook.title);
      // Use the service to permanently delete the book
      this.archivedBooksService.removeArchivedBook(this.selectedBook.id);
      this.closeDeleteModal();
    }
  }
}