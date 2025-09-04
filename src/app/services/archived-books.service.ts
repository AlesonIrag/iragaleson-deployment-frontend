import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ArchivedBook {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  subject?: string;
  callNumber?: string;
  archiveReason: 'Damaged' | 'Lost' | 'Outdated' | 'Duplicate' | 'Policy';
  archiveNotes?: string;
  archivedDate: Date;
  archivedBy: string;
  originalBookId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ArchivedBooksService {
  private archivedBooksSubject = new BehaviorSubject<ArchivedBook[]>([
    {
      id: 1,
      title: 'Introduction to Programming (2nd Edition)',
      author: 'John Smith',
      isbn: '978-0123456789',
      category: 'Technology',
      subject: 'Computer Science',
      callNumber: 'QA76.6.S65',
      archiveReason: 'Outdated',
      archiveNotes: 'Replaced with newer edition',
      archivedDate: new Date('2024-01-15'),
      archivedBy: 'Admin User',
      originalBookId: 101
    },
    {
      id: 2,
      title: 'Advanced Mathematics',
      author: 'Jane Doe',
      isbn: '978-0987654321',
      category: 'Mathematics',
      subject: 'Calculus',
      callNumber: 'QA303.D63',
      archiveReason: 'Damaged',
      archiveNotes: 'Water damage from library flood',
      archivedDate: new Date('2024-02-20'),
      archivedBy: 'Library Staff',
      originalBookId: 102
    },
    {
      id: 3,
      title: 'History of Ancient Rome',
      author: 'Robert Johnson',
      isbn: '978-0456789123',
      category: 'History',
      subject: 'Ancient History',
      callNumber: 'DG77.J64',
      archiveReason: 'Lost',
      archiveNotes: 'Lost by student, replacement fee paid',
      archivedDate: new Date('2024-03-10'),
      archivedBy: 'Circulation Desk',
      originalBookId: 103
    },
    {
      id: 4,
      title: 'Basic Chemistry Principles',
      author: 'Sarah Wilson',
      isbn: '978-0789123456',
      category: 'Science',
      subject: 'Chemistry',
      callNumber: 'QD31.3.W55',
      archiveReason: 'Duplicate',
      archiveNotes: 'Duplicate copy, keeping newer edition',
      archivedDate: new Date('2024-01-25'),
      archivedBy: 'Head Librarian',
      originalBookId: 104
    },
    {
      id: 5,
      title: 'Business Ethics (1st Edition)',
      author: 'Michael Brown',
      isbn: '978-0321654987',
      category: 'Business',
      subject: 'Ethics',
      callNumber: 'HF5387.B76',
      archiveReason: 'Policy',
      archiveNotes: 'Removed due to curriculum change',
      archivedDate: new Date('2024-02-05'),
      archivedBy: 'Academic Director',
      originalBookId: 105
    },
    {
      id: 6,
      title: 'Organic Chemistry Lab Manual',
      author: 'Lisa Davis',
      isbn: '978-0654321987',
      category: 'Science',
      subject: 'Chemistry',
      callNumber: 'QD261.D28',
      archiveReason: 'Damaged',
      archiveNotes: 'Pages torn and illegible',
      archivedDate: new Date('2024-03-01'),
      archivedBy: 'Lab Coordinator',
      originalBookId: 106
    },
    {
      id: 7,
      title: 'World Literature Anthology (3rd Ed)',
      author: 'Various Authors',
      isbn: '978-0147258369',
      category: 'Literature',
      subject: 'World Literature',
      callNumber: 'PN6014.W67',
      archiveReason: 'Outdated',
      archiveNotes: 'Curriculum updated, newer anthology adopted',
      archivedDate: new Date('2024-01-30'),
      archivedBy: 'English Department',
      originalBookId: 107
    },
    {
      id: 8,
      title: 'Physics for Engineers',
      author: 'David Lee',
      isbn: '978-0258147369',
      category: 'Engineering',
      subject: 'Physics',
      callNumber: 'QC21.3.L44',
      archiveReason: 'Lost',
      archiveNotes: 'Missing from shelf, presumed lost',
      archivedDate: new Date('2024-02-15'),
      archivedBy: 'Inventory Team',
      originalBookId: 108
    }
  ]);

  public archivedBooks$ = this.archivedBooksSubject.asObservable();

  constructor() { }

  getArchivedBooks(): Observable<ArchivedBook[]> {
    return this.archivedBooks$;
  }

  getAllArchivedBooks(): ArchivedBook[] {
    return this.archivedBooksSubject.value;
  }

  addArchivedBook(book: any, archiveReason: string, archiveNotes: string, archivedBy: string): void {
    const currentBooks = this.archivedBooksSubject.value;
    const newId = Math.max(...currentBooks.map(b => b.id), 0) + 1;
    
    const archivedBook: ArchivedBook = {
      id: newId,
      title: book.Title,
      author: book.Author || 'Unknown Author',
      isbn: book.ISBN,
      category: book.Category || 'Uncategorized',
      subject: book.Subject,
      callNumber: book.CallNumber,
      archiveReason: archiveReason as 'Damaged' | 'Lost' | 'Outdated' | 'Duplicate' | 'Policy',
      archiveNotes: archiveNotes,
      archivedDate: new Date(),
      archivedBy: archivedBy,
      originalBookId: book.BookID
    };

    const updatedBooks = [...currentBooks, archivedBook];
    this.archivedBooksSubject.next(updatedBooks);
  }

  removeArchivedBook(id: number): void {
    const currentBooks = this.archivedBooksSubject.value;
    const updatedBooks = currentBooks.filter(book => book.id !== id);
    this.archivedBooksSubject.next(updatedBooks);
  }

  restoreBook(id: number): ArchivedBook | null {
    const currentBooks = this.archivedBooksSubject.value;
    const bookToRestore = currentBooks.find(book => book.id === id);
    
    if (bookToRestore) {
      const updatedBooks = currentBooks.filter(book => book.id !== id);
      this.archivedBooksSubject.next(updatedBooks);
      return bookToRestore;
    }
    
    return null;
  }
}