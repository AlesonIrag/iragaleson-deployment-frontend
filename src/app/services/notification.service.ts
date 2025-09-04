import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'borrow_request' | 'borrow_approved' | 'borrow_denied' | 'book_returned' | 'overdue_reminder' | 'reservation_request';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  recipientType: 'student' | 'admin';
  recipientId?: string;
  relatedBookId?: string;
  relatedBookTitle?: string;
  relatedStudentId?: string;
  relatedStudentName?: string;
  actionRequired?: boolean;
  actionData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  // Get all notifications
  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  // Get unread notifications count
  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.notifications$.subscribe(notifications => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        observer.next(unreadCount);
      });
    });
  }

  // Add new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      isRead: false
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.notificationsSubject.next([...this.notifications]);
    
    console.log('📢 New notification added:', newNotification);
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
      this.notificationsSubject.next([...this.notifications]);
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
    this.notificationsSubject.next([...this.notifications]);
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notificationsSubject.next([...this.notifications]);
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notificationsSubject.next([]);
  }

  // Get notifications for specific recipient
  getNotificationsForRecipient(recipientType: 'student' | 'admin', recipientId?: string): Observable<Notification[]> {
    return new Observable(observer => {
      this.notifications$.subscribe(notifications => {
        const filtered = notifications.filter(n => {
          if (n.recipientType !== recipientType) return false;
          if (recipientId && n.recipientId && n.recipientId !== recipientId) return false;
          return true;
        });
        observer.next(filtered);
      });
    });
  }

  // Create borrow request notification for admin
  createBorrowRequestNotification(studentName: string, studentId: string, bookTitle: string, bookId: string): void {
    this.addNotification({
      type: 'borrow_request',
      title: 'New Borrow Request',
      message: `${studentName} wants to borrow "${bookTitle}"`,
      recipientType: 'admin',
      relatedBookId: bookId,
      relatedBookTitle: bookTitle,
      relatedStudentId: studentId,
      relatedStudentName: studentName,
      actionRequired: true,
      actionData: {
        studentId,
        studentName,
        bookId,
        bookTitle,
        requestType: 'borrow'
      }
    });
  }

  // Create borrow approval notification for student
  createBorrowApprovalNotification(studentId: string, bookTitle: string, bookId: string): void {
    this.addNotification({
      type: 'borrow_approved',
      title: 'Borrow Request Approved',
      message: `Your request to borrow "${bookTitle}" has been approved by the librarian`,
      recipientType: 'student',
      recipientId: studentId,
      relatedBookId: bookId,
      relatedBookTitle: bookTitle,
      actionRequired: false
    });
  }

  // Create borrow denial notification for student
  createBorrowDenialNotification(studentId: string, bookTitle: string, bookId: string, reason?: string): void {
    const message = reason 
      ? `Your request to borrow "${bookTitle}" has been denied. Reason: ${reason}`
      : `Your request to borrow "${bookTitle}" has been denied by the librarian`;
      
    this.addNotification({
      type: 'borrow_denied',
      title: 'Borrow Request Denied',
      message,
      recipientType: 'student',
      recipientId: studentId,
      relatedBookId: bookId,
      relatedBookTitle: bookTitle,
      actionRequired: false
    });
  }

  // Private methods
  private generateId(): string {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem('lms_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('lms_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notificationsSubject.next([...this.notifications]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }
}
