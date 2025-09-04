import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

export interface OverdueBook {
  transactionId: string;
  userName: string;
  userId: string;
  bookTitle: string;
  dueDate: string;
  daysOverdue: number;
}

@Injectable({
  providedIn: 'root'
})
export class OverdueService {

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {
    // Check for overdue books every hour
    this.startOverdueCheck();
  }

  // Start periodic checking for overdue books
  private startOverdueCheck(): void {
    // Check immediately on service initialization
    this.checkOverdueBooks();

    // Then check every hour (3600000 ms)
    interval(3600000).subscribe(() => {
      this.checkOverdueBooks();
    });
  }

  // Check for overdue books and create notifications/fines
  checkOverdueBooks(): void {
    console.log('🔍 Checking for overdue books...');

    this.apiService.get('/borrowing/check-overdue').subscribe({
      next: (response: any) => {
        if (response.success && response.data.length > 0) {
          console.log(`📚 Found ${response.data.length} overdue books`);
          
          response.data.forEach((overdueBook: OverdueBook) => {
            this.handleOverdueBook(overdueBook);
          });
        } else {
          console.log('✅ No overdue books found');
        }
      },
      error: (error) => {
        console.error('❌ Error checking overdue books:', error);
      }
    });
  }

  // Handle individual overdue book
  private handleOverdueBook(overdueBook: OverdueBook): void {
    console.log(`📖 Processing overdue book: ${overdueBook.bookTitle} by ${overdueBook.userName}`);

    // Create notification for admin
    this.createOverdueNotification(overdueBook);

    // Create or update fine
    this.createOrUpdateFine(overdueBook);
  }

  // Create overdue notification for admin
  private createOverdueNotification(overdueBook: OverdueBook): void {
    const message = `${overdueBook.userName} has an overdue book: "${overdueBook.bookTitle}". ` +
                   `Due date was ${overdueBook.dueDate} (${overdueBook.daysOverdue} days overdue). ` +
                   `Daily fine of ₱5.00 applies.`;

    this.notificationService.addNotification({
      type: 'overdue_reminder',
      title: 'Overdue Book Alert',
      message: message,
      recipientType: 'admin',
      recipientId: 'admin',
      relatedBookTitle: overdueBook.bookTitle,
      relatedStudentId: overdueBook.userId,
      relatedStudentName: overdueBook.userName,
      actionRequired: true,
      actionData: {
        transactionId: overdueBook.transactionId,
        userId: overdueBook.userId,
        userName: overdueBook.userName,
        bookTitle: overdueBook.bookTitle,
        daysOverdue: overdueBook.daysOverdue,
        fineAmount: overdueBook.daysOverdue * 5.00
      }
    });

    console.log(`📢 Created overdue notification for ${overdueBook.userName}`);
  }

  // Create or update fine for overdue book
  private createOrUpdateFine(overdueBook: OverdueBook): void {
    const fineAmount = overdueBook.daysOverdue * 5.00; // ₱5.00 per day
    const description = `Overdue fine for "${overdueBook.bookTitle}" - ${overdueBook.daysOverdue} days overdue at ₱5.00 per day`;

    this.apiService.post('/borrowing/create-fine', {
      transactionId: overdueBook.transactionId,
      amount: fineAmount,
      description: description
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log(`💰 Created fine of ₱${fineAmount} for ${overdueBook.userName}`);
        } else {
          console.log(`ℹ️ Fine already exists for transaction ${overdueBook.transactionId}`);
        }
      },
      error: (error) => {
        console.error('❌ Error creating fine:', error);
      }
    });
  }

  // Get all overdue books
  getOverdueBooks(): Observable<any> {
    return this.apiService.get('/borrowing/check-overdue');
  }

  // Mark fine as paid
  markFineAsPaid(fineId: string): Observable<any> {
    return this.apiService.put(`/borrowing/mark-fine-paid/${fineId}`, {});
  }

  // Get fines for a specific user
  getUserFines(userId: string): Observable<any> {
    return this.apiService.get(`/borrowing/fines/${userId}`);
  }

  // Calculate total fine amount for a user
  calculateTotalFine(overdueBooks: OverdueBook[]): number {
    return overdueBooks.reduce((total, book) => {
      return total + (book.daysOverdue * 5.00);
    }, 0);
  }

  // Format fine amount for display
  formatFineAmount(amount: number): string {
    return `₱${amount.toFixed(2)}`;
  }

  // Get fine status message
  getFineStatusMessage(daysOverdue: number): string {
    const fineAmount = daysOverdue * 5.00;
    return `${daysOverdue} day(s) overdue - Fine: ₱${fineAmount.toFixed(2)}`;
  }
}
