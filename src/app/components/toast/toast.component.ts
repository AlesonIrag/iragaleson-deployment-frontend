import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div 
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="toast-container transform transition-all duration-300 ease-in-out"
        [ngClass]="getToastClasses(toast)"
        [attr.data-toast-id]="toast.id">
        
        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0 mr-3">
            <svg *ngIf="toast.type === 'success'" class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            
            <svg *ngIf="toast.type === 'error'" class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            
            <svg *ngIf="toast.type === 'warning'" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            
            <svg *ngIf="toast.type === 'info'" class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" [ngClass]="getTitleClasses(toast)">
              {{ toast.title }}
            </p>
            <p *ngIf="toast.message" class="mt-1 text-sm" [ngClass]="getMessageClasses(toast)">
              {{ toast.message }}
            </p>
          </div>
          
          <!-- Dismiss Button -->
          <div *ngIf="toast.dismissible" class="ml-4 flex-shrink-0">
            <button
              (click)="dismiss(toast.id)"
              class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              [ngClass]="getDismissButtonClasses(toast)">
              <span class="sr-only">Close</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Auto-dismiss progress bar -->
        <div *ngIf="toast.duration && toast.duration > 0" class="mt-2">
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div
              class="h-1 rounded-full transition-all ease-linear"
              [ngClass]="getProgressBarClasses(toast)"
              [style.animation-duration.ms]="toast.duration"
              style="width: 100%; animation-name: shrinkWidth; animation-timing-function: linear; animation-fill-mode: forwards;">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      max-width: 384px;
      min-width: 320px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(8px);
    }
    
    .toast-enter {
      animation: slideInRight 0.3s ease-out;
    }
    
    .toast-leave {
      animation: slideOutRight 0.3s ease-in;
    }
    
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    @keyframes shrinkWidth {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  dismissingToasts: Set<string> = new Set();
  private subscription: Subscription = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.toastService.toasts$.subscribe(toasts => {
        this.toasts = toasts;
      })
    );

    // Listen for dismiss animations triggered by auto-dismiss
    this.subscription.add(
      this.toastService.dismiss$.subscribe(id => {
        this.dismiss(id);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  dismiss(id: string): void {
    // Add outro animation before dismissing
    this.dismissingToasts.add(id);

    // Wait for animation to complete before actually removing
    setTimeout(() => {
      this.dismissingToasts.delete(id);
      this.toastService.dismiss(id);
    }, 300); // Match the animation duration
  }

  getToastClasses(toast: Toast): string {
    const isDismissing = this.dismissingToasts.has(toast.id);
    const animationClass = isDismissing ? 'toast-leave' : 'toast-enter';
    const baseClasses = `toast-container ${animationClass}`;

    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700`;
      case 'error':
        return `${baseClasses} bg-red-50 border border-red-200 dark:bg-red-900 dark:border-red-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700`;
      case 'info':
        return `${baseClasses} bg-blue-50 border border-blue-200 dark:bg-blue-900 dark:border-blue-700`;
      default:
        return `${baseClasses} bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700`;
    }
  }

  getTitleClasses(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  }

  getMessageClasses(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'error':
        return 'text-red-700 dark:text-red-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  }

  getDismissButtonClasses(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return 'text-green-400 hover:text-green-500 focus:ring-green-500 dark:text-green-300 dark:hover:text-green-400';
      case 'error':
        return 'text-red-400 hover:text-red-500 focus:ring-red-500 dark:text-red-300 dark:hover:text-red-400';
      case 'warning':
        return 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500 dark:text-yellow-300 dark:hover:text-yellow-400';
      case 'info':
        return 'text-blue-400 hover:text-blue-500 focus:ring-blue-500 dark:text-blue-300 dark:hover:text-blue-400';
      default:
        return 'text-gray-400 hover:text-gray-500 focus:ring-gray-500 dark:text-gray-300 dark:hover:text-gray-400';
    }
  }

  getProgressBarClasses(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500 dark:bg-green-400';
      case 'error':
        return 'bg-red-500 dark:bg-red-400';
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-400';
      case 'info':
        return 'bg-blue-500 dark:bg-blue-400';
      default:
        return 'bg-gray-500 dark:bg-gray-400';
    }
  }
}
