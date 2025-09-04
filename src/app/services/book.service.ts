import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Book {
  BookID?: number;
  Title: string;
  Author: string;
  ISBN: string;
  Category: string;
  Subject?: string;
  PublishedYear?: number;
  CopyrightYear?: number;
  Publisher?: string;
  CallNumber?: string;
  DeweyDecimal?: string;
  Copies: number;
  Remarks?: string;
  Status: 'Available' | 'Borrowed' | 'Lost' | 'Damaged';
  ShelfLocation: string;
  AcquisitionDate?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface StudentBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  subject?: string;
  location: string;
  availability: 'Available' | 'Checked Out' | 'Reserved' | 'Maintenance';
  coverImage?: string;
  description?: string;
  publishedYear?: number;
  publisher?: string;
  copies: number;
  callNumber?: string;
}

export interface BorrowRequest {
  studentId: string;
  bookId: number;
  borrowDate: string;
  dueDate: string;
}

export interface ReservationRequest {
  studentId: string;
  bookId: number;
  reservationDate: string;
  expiryDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {

  constructor(private apiService: ApiService) { }

  /**
   * Get all available books for students
   */
  getAllBooks(): Observable<StudentBook[]> {
    // Request all books with a high limit to ensure we get all books
    return this.apiService.get('/books/get-all-books?limit=10000').pipe(
      map((response: any) => {
        if (response.success && response.books) {
          console.log(`📚 BookService: Received ${response.books.length} books from API`);
          return response.books.map((book: Book) => this.mapToStudentBook(book));
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching books:', error);
        return of([]);
      })
    );
  }

  /**
   * Get books by category
   */
  getBooksByCategory(category: string): Observable<StudentBook[]> {
    return this.getAllBooks().pipe(
      map(books => books.filter(book => 
        category === 'all' || book.category.toLowerCase() === category.toLowerCase()
      ))
    );
  }

  /**
   * Search books by title, author, or ISBN
   */
  searchBooks(query: string): Observable<StudentBook[]> {
    return this.getAllBooks().pipe(
      map(books => books.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.isbn.includes(query)
      ))
    );
  }

  /**
   * Get book by ID
   */
  getBookById(bookId: string): Observable<StudentBook | null> {
    return this.apiService.get(`/books/get-book/${bookId}`).pipe(
      map((response: any) => {
        if (response.success && response.book) {
          return this.mapToStudentBook(response.book);
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error fetching book:', error);
        return of(null);
      })
    );
  }

  /**
   * Borrow a book (placeholder - would need backend implementation)
   */
  borrowBook(borrowRequest: BorrowRequest): Observable<any> {
    // This would need to be implemented in the backend
    console.log('Borrow request:', borrowRequest);
    
    // For now, return a mock success response
    return of({
      success: true,
      message: 'Book borrowed successfully',
      loanId: `L${Date.now()}`
    });
  }

  /**
   * Reserve a book (placeholder - would need backend implementation)
   */
  reserveBook(reservationRequest: ReservationRequest): Observable<any> {
    // This would need to be implemented in the backend
    console.log('Reservation request:', reservationRequest);

    // For now, return a mock success response
    return of({
      success: true,
      message: 'Book reserved successfully',
      reservationId: `R${Date.now()}`
    });
  }

  /**
   * Get student library statistics
   */
  getStudentStats(studentId: string): Observable<any> {
    return this.apiService.get(`/borrowing/student-stats/${studentId}`).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return {
          borrowed: 0,
          returned: 0,
          reservations: 0,
          fines: 0
        };
      }),
      catchError((error) => {
        console.error('Error fetching student stats:', error);
        return of({
          borrowed: 0,
          returned: 0,
          reservations: 0,
          fines: 0
        });
      })
    );
  }

  /**
   * Get student transactions
   */
  getStudentTransactions(studentId: string, status?: string): Observable<any[]> {
    const url = status
      ? `/borrowing/student-transactions/${studentId}?status=${status}`
      : `/borrowing/student-transactions/${studentId}`;

    return this.apiService.get(url).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching student transactions:', error);
        return of([]);
      })
    );
  }

  /**
   * Get student reservations
   */
  getStudentReservations(studentId: string): Observable<any[]> {
    return this.apiService.get(`/borrowing/student-reservations/${studentId}`).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching student reservations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get student fines
   */
  getStudentFines(studentId: string): Observable<any[]> {
    return this.apiService.get(`/borrowing/student-fines/${studentId}`).pipe(
      map((response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching student fines:', error);
        return of([]);
      })
    );
  }

  /**
   * Check book availability
   */
  checkAvailability(bookId: string): Observable<string> {
    return this.getBookById(bookId).pipe(
      map(book => book ? book.availability : 'Unavailable')
    );
  }

  /**
   * Map database book to student book interface
   */
  private mapToStudentBook(book: Book): StudentBook {
    return {
      id: book.BookID?.toString() || '',
      title: book.Title,
      author: book.Author,
      isbn: book.ISBN,
      category: book.Category,
      subject: book.Subject,
      location: book.ShelfLocation,
      availability: this.mapStatus(book.Status),
      description: book.Remarks,
      publishedYear: book.PublishedYear,
      publisher: book.Publisher,
      copies: book.Copies,
      callNumber: book.CallNumber
    };
  }

  /**
   * Map database status to student-friendly availability
   */
  private mapStatus(status: string): 'Available' | 'Checked Out' | 'Reserved' | 'Maintenance' {
    switch (status) {
      case 'Available':
        return 'Available';
      case 'Borrowed':
        return 'Checked Out';
      case 'Lost':
      case 'Damaged':
        return 'Maintenance';
      default:
        return 'Available';
    }
  }

  /**
   * Get unique categories from all books
   */
  getCategories(): Observable<string[]> {
    return this.getAllBooks().pipe(
      map(books => {
        const categories = books.map(book => book.category);
        return [...new Set(categories)].sort();
      })
    );
  }

  /**
   * Get unique subjects from all books
   */
  getSubjects(): Observable<string[]> {
    return this.getAllBooks().pipe(
      map(books => {
        const subjects = books
          .map(book => book.subject)
          .filter((subject): subject is string => subject !== undefined && subject !== null);
        return [...new Set(subjects)].sort();
      })
    );
  }
}
