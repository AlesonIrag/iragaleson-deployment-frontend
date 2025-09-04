import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  // Subject to trigger dismiss animations
  private dismissSubject = new Subject<string>();
  public dismiss$ = this.dismissSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addToast(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      id: this.generateId(),
      duration: 5000,
      dismissible: true,
      ...toast
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismissWithAnimation(newToast.id);
      }, newToast.duration);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    this.addToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(title: string, message?: string, duration?: number): void {
    this.addToast({
      type: 'error',
      title,
      message,
      duration: duration || 8000 // Errors stay longer
    });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.addToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(title: string, message?: string, duration?: number): void {
    this.addToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  dismissWithAnimation(id: string): void {
    // Trigger the dismiss animation
    this.dismissSubject.next(id);
  }

  dismiss(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }
}
