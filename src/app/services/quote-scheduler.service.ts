import { Injectable, OnDestroy } from '@angular/core';
import { QuoteService } from './quote.service';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuoteSchedulerService implements OnDestroy {
  private schedulerSubscription?: Subscription;
  private lastUpdateDate: string = '';

  constructor(
    private quoteService: QuoteService,
    private authService: AuthService
  ) {
    this.initializeScheduler();
  }

  ngOnDestroy(): void {
    if (this.schedulerSubscription) {
      this.schedulerSubscription.unsubscribe();
    }
  }

  /**
   * Initialize the quote scheduler
   */
  private initializeScheduler(): void {
    console.log('🕛 Quote Scheduler initialized');
    
    // Check immediately on service start
    this.checkAndUpdateQuote();
    
    // Then check every minute
    this.schedulerSubscription = interval(60000).subscribe(() => {
      this.checkAndUpdateQuote();
    });
  }

  /**
   * Check if it's time to update the quote (at 12:00 AM)
   */
  private checkAndUpdateQuote(): void {
    const now = new Date();
    const currentDate = this.formatDate(now);
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    // Check if it's a new day and it's 12:00 AM (or within the first minute)
    const isMidnight = currentTime === 0; // Exactly 12:00 AM
    const isNewDay = this.lastUpdateDate !== currentDate;
    
    if (isNewDay && (isMidnight || this.isFirstCheckOfDay())) {
      console.log('🌅 New day detected at midnight, updating quote of the day...');
      this.updateQuoteOfTheDay();
      this.lastUpdateDate = currentDate;
    }
  }

  /**
   * Check if this is the first check of the day (for cases where app starts after midnight)
   */
  private isFirstCheckOfDay(): boolean {
    const now = new Date();
    const currentDate = this.formatDate(now);
    
    // If we haven't updated today and it's past midnight, update now
    return this.lastUpdateDate !== currentDate && now.getHours() >= 0;
  }

  /**
   * Update quote of the day for current user
   */
  private updateQuoteOfTheDay(): void {
    const userRole = this.quoteService.detectUserRole();
    console.log(`🔄 Updating quote of the day for role: ${userRole}`);
    
    // Clear the cached quote to force a fresh fetch
    localStorage.removeItem('quote_of_the_day');
    localStorage.removeItem('quote_last_fetch');
    
    // Fetch new quote
    this.quoteService.getQuoteOfTheDay(userRole).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Quote of the day updated successfully at midnight');
        } else {
          console.error('❌ Failed to update quote of the day:', response.message);
        }
      },
      error: (error) => {
        console.error('❌ Error updating quote of the day:', error);
      }
    });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  }

  /**
   * Get time until next midnight in milliseconds
   */
  private getTimeUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight
    
    return midnight.getTime() - now.getTime();
  }

  /**
   * Force update quote (for testing purposes)
   */
  forceUpdateQuote(): void {
    console.log('🔄 Force updating quote of the day...');
    this.updateQuoteOfTheDay();
  }

  /**
   * Get next update time as string
   */
  getNextUpdateTime(): string {
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    
    const timeUntil = nextMidnight.getTime() - now.getTime();
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }
}