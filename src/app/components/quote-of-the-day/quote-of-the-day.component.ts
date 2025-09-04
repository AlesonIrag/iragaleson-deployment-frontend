import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { QuoteService, Quote } from '../../services/quote.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-quote-of-the-day',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quote-of-the-day-container rounded-lg p-6 shadow-sm border transition-all duration-300 hover:shadow-md"
         [class]="getCardClasses()">
      
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"></path>
          </svg>
          <h3 class="text-lg font-semibold" [class]="getTextClasses()">Quote of the Day</h3>
        </div>
        
        <!-- Refresh Button -->
        <button (click)="refreshQuote()" 
                [disabled]="isLoading"
                class="p-2 rounded-full transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Refresh quote">
          <svg class="w-4 h-4" [class]="isLoading ? 'animate-spin text-blue-500' : 'text-gray-500 dark:text-gray-400'" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading && !currentQuote) {
        <div class="flex items-center justify-center py-8">
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span [class]="getSecondaryTextClasses()">Loading today's inspiration...</span>
          </div>
        </div>
      }

      <!-- Quote Content -->
      @if (currentQuote) {
        <div class="quote-content">
          <!-- Quote Text -->
          <blockquote class="relative mb-6">
            <svg class="absolute -top-2 -left-2 w-8 h-8 text-blue-200 dark:text-blue-800" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
            
            <p class="text-lg italic leading-relaxed pl-6 pr-2 mb-4" [class]="getTextClasses()">
              "{{ currentQuote.text }}"
            </p>
            
            <!-- Author Display -->
            <div class="flex items-center pl-6">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium" [class]="getSecondaryTextClasses()">Quote by</p>
                <p class="text-lg font-bold" [class]="getTextClasses()">{{ currentQuote.author }}</p>
              </div>
            </div>
          </blockquote>

          <!-- Category Info -->
          <div class="flex items-center justify-between pt-4 border-t" 
               [class]="isDarkMode ? 'border-gray-700' : 'border-gray-200'">
            <div class="text-xs" [class]="getSecondaryTextClasses()">
              Updated daily at 12:00 AM
            </div>
          </div>
        </div>
      }

      <!-- Error State -->
      @if (error && !currentQuote) {
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          <button (click)="refreshQuote()" 
                  class="mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
            Try Again
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .quote-of-the-day-container {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
    }
    
    .quote-content {
      animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    blockquote {
      position: relative;
    }
    
    .dark .quote-of-the-day-container {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
    }
  `]
})
export class QuoteOfTheDayComponent implements OnInit, OnDestroy {
  @Input() userRole: 'admin' | 'faculty' | 'student' | 'auto' = 'auto';
  @Input() showRefreshButton: boolean = true;
  @Input() autoRefresh: boolean = true;

  currentQuote: Quote | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  private subscriptions: Subscription[] = [];
  private midnightCheckInterval?: Subscription;

  constructor(
    private quoteService: QuoteService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadQuoteOfTheDay();
    
    // Subscribe to quote updates
    const quoteSubscription = this.quoteService.currentQuote$.subscribe(quote => {
      if (quote) {
        this.currentQuote = quote;
        this.error = null;
      }
    });
    this.subscriptions.push(quoteSubscription);

    // Set up midnight check for auto-refresh
    if (this.autoRefresh) {
      this.setupMidnightCheck();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.midnightCheckInterval) {
      this.midnightCheckInterval.unsubscribe();
    }
  }

  /**
   * Load quote of the day
   */
  loadQuoteOfTheDay(): void {
    this.isLoading = true;
    this.error = null;

    const actualRole = this.userRole === 'auto' ? this.quoteService.detectUserRole() : this.userRole;
    const subscription = this.quoteService.getQuoteOfTheDay(actualRole).subscribe({
      next: (response) => {
        if (response.success && response.quote) {
          this.currentQuote = response.quote;
          this.error = null;
        } else {
          this.error = response.message || 'Failed to load quote';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quote of the day:', error);
        this.error = 'Failed to load quote of the day';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Refresh quote manually
   */
  refreshQuote(): void {
    this.isLoading = true;
    this.error = null;

    const actualRole = this.userRole === 'auto' ? this.quoteService.detectUserRole() : this.userRole;
    const subscription = this.quoteService.refreshQuote(actualRole).subscribe({
      next: (response) => {
        if (response.success && response.quote) {
          this.currentQuote = response.quote;
          this.error = null;
        } else {
          this.error = response.message || 'Failed to refresh quote';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error refreshing quote:', error);
        this.error = 'Failed to refresh quote';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Setup midnight check for auto-refresh
   */
  private setupMidnightCheck(): void {
    // Check every minute if it's past midnight
    this.midnightCheckInterval = interval(60000).subscribe(() => {
      const actualRole = this.userRole === 'auto' ? this.quoteService.detectUserRole() : this.userRole;
      this.quoteService.checkForQuoteUpdate(actualRole);
    });
  }

  /**
   * Get CSS classes for card styling
   */
  getCardClasses(): string {
    return this.isDarkMode
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-gray-200';
  }

  /**
   * Get CSS classes for text styling
   */
  getTextClasses(): string {
    return this.isDarkMode ? 'text-white' : 'text-gray-900';
  }

  /**
   * Get CSS classes for secondary text styling
   */
  getSecondaryTextClasses(): string {
    return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
  }

  /**
   * Get dark mode state
   */
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }
}