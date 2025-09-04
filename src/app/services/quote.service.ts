import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
}

export interface QuoteResponse {
  quote: Quote;
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private readonly API_BASE_URL = 'https://benedictocollege-quote-api.netlify.app/.netlify/functions';
  private readonly STORAGE_KEY = 'quote_of_the_day';
  private readonly LAST_FETCH_KEY = 'quote_last_fetch';

  // Categories for different user roles
  private readonly ROLE_CATEGORIES = {
    admin: ['random'],
    faculty: ['teachers', 'motivation', 'inspiration', 'education'],
    student: ['students', 'motivation', 'inspiration', 'education']
  };

  // BehaviorSubject to track current quote
  private currentQuoteSubject = new BehaviorSubject<Quote | null>(null);
  public currentQuote$ = this.currentQuoteSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🎯 QuoteService initialized');
    console.log('🌐 API Base URL:', this.API_BASE_URL);
    this.initializeQuoteOfTheDay();
  }

  /**
   * Initialize quote of the day - check if we need to fetch a new quote
   */
  private initializeQuoteOfTheDay(): void {
    const today = this.getTodayDateString();
    const lastFetchDate = localStorage.getItem(this.LAST_FETCH_KEY);
    
    console.log('🌅 Initializing quote of the day');
    console.log('📅 Today:', today);
    console.log('📅 Last fetch date:', lastFetchDate);
    
    if (lastFetchDate !== today) {
      // New day, clear old quote and fetch new one
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🌅 New day detected, will fetch fresh quote of the day');
    } else {
      // Same day, load cached quote if available
      const cachedQuote = this.getCachedQuote();
      if (cachedQuote) {
        this.currentQuoteSubject.next(cachedQuote);
        console.log('📖 Loaded cached quote of the day:', cachedQuote);
      }
    }
  }

  /**
   * Get quote of the day for specific user role
   */
  getQuoteOfTheDay(userRole: 'admin' | 'faculty' | 'student'): Observable<QuoteResponse> {
    const today = this.getTodayDateString();
    const lastFetchDate = localStorage.getItem(this.LAST_FETCH_KEY);
    
    // Check if we already have today's quote
    if (lastFetchDate === today) {
      const cachedQuote = this.getCachedQuote();
      if (cachedQuote) {
        console.log('📖 Returning cached quote of the day');
        return of({
          quote: cachedQuote,
          success: true,
          message: 'Quote of the day (cached)'
        });
      }
    }

    // Fetch new quote for the day
    console.log(`🎯 Fetching new quote of the day for role: ${userRole}`);
    return this.fetchNewQuoteOfTheDay(userRole);
  }

  /**
   * Fetch a new quote of the day for the specified role
   */
  private fetchNewQuoteOfTheDay(userRole: 'admin' | 'faculty' | 'student'): Observable<QuoteResponse> {
    const categories = this.ROLE_CATEGORIES[userRole];
    const selectedCategory = this.selectRandomCategory(categories, userRole);
    
    console.log(`🎲 Selected category for ${userRole}: ${selectedCategory}`);
    
    // Use the correct API URL format based on your API structure
    const url = selectedCategory === 'random' 
      ? 'https://benedictocollege-quote-api.netlify.app/.netlify/functions/random'
      : `https://benedictocollege-quote-api.netlify.app/.netlify/functions/random?category=${selectedCategory}`;

    console.log('🌐 Making API request to:', url);

    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log('🔍 Raw API response:', response);
      }),
      map(response => {
        // Handle the API response format: { "quote": "...", "author": "...", "category": "..." }
        if (response && (response.quote || response.text)) {
          const quote: Quote = {
            id: Date.now(), // Generate ID since API doesn't provide one
            text: response.quote || response.text || 'No quote available',
            author: response.author || 'Unknown Author',
            category: response.category || selectedCategory
          };
          
          // Cache the quote for today
          this.cacheQuoteOfTheDay(quote);
          this.currentQuoteSubject.next(quote);
          
          console.log('✅ Quote of the day fetched and cached:', quote);
          console.log('👤 Author extracted:', quote.author);
          
          return {
            quote: quote,
            success: true,
            message: 'Quote fetched successfully'
          };
        } else {
          console.log('❌ Invalid API response format:', response);
          throw new Error('Invalid API response format');
        }
      }),
      catchError(error => {
        console.error('❌ Error fetching quote of the day:', error);
        const fallbackQuote = this.getFallbackQuote(userRole);
        this.currentQuoteSubject.next(fallbackQuote);
        return of({
          quote: fallbackQuote,
          success: false,
          message: `API Error: ${error.message || 'Failed to fetch quote'}`
        });
      })
    );
  }

  /**
   * Select a random category based on user role and current date
   */
  private selectRandomCategory(categories: string[], userRole: string): string {
    // Use date as seed for consistent daily selection
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // Add user role to seed for different quotes per role on same day
    const roleMultiplier = userRole === 'admin' ? 1 : userRole === 'faculty' ? 2 : 3;
    const finalSeed = seed * roleMultiplier;
    
    const index = finalSeed % categories.length;
    return categories[index];
  }

  /**
   * Cache quote of the day in localStorage
   */
  private cacheQuoteOfTheDay(quote: Quote): void {
    const today = this.getTodayDateString();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quote));
    localStorage.setItem(this.LAST_FETCH_KEY, today);
  }

  /**
   * Get cached quote from localStorage
   */
  private getCachedQuote(): Quote | null {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error parsing cached quote:', error);
      return null;
    }
  }

  /**
   * Get today's date as string (YYYY-MM-DD)
   */
  private getTodayDateString(): string {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  }

  /**
   * Extract author from API response with multiple fallback options
   */
  private extractAuthor(quoteData: any): string {
    // Try different possible author field names from your API
    const possibleAuthorFields = [
      'author',
      'Author', 
      'by',
      'attribution',
      'source',
      'writer'
    ];

    for (const field of possibleAuthorFields) {
      if (quoteData[field] && typeof quoteData[field] === 'string' && quoteData[field].trim()) {
        const author = quoteData[field].trim();
        console.log(`📝 Found author in field '${field}':`, author);
        return author;
      }
    }

    // If no author found, return a meaningful default
    console.log('⚠️ No author found in API response, using default');
    return 'Anonymous';
  }

  /**
   * Get fallback quote when API fails
   */
  private getFallbackQuote(userRole: string): Quote {
    const fallbackQuotes = {
      admin: {
        id: 0,
        text: "Leadership is not about being in charge. It is about taking care of those in your charge.",
        author: "Simon Sinek",
        category: "leadership"
      },
      faculty: {
        id: 0,
        text: "Teaching is the profession that teaches all the other professions.",
        author: "Unknown",
        category: "teachers"
      },
      student: {
        id: 0,
        text: "Education is the most powerful weapon which you can use to change the world.",
        author: "Nelson Mandela",
        category: "education"
      }
    };

    return fallbackQuotes[userRole as keyof typeof fallbackQuotes];
  }

  /**
   * Force refresh quote (for testing or manual refresh)
   */
  refreshQuote(userRole: 'admin' | 'faculty' | 'student'): Observable<QuoteResponse> {
    // Clear cache to force new fetch
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LAST_FETCH_KEY);
    
    return this.fetchNewQuoteOfTheDay(userRole);
  }

  /**
   * Check if it's time to update quote (12 AM check)
   */
  checkForQuoteUpdate(userRole: 'admin' | 'faculty' | 'student'): void {
    const now = new Date();
    const lastFetchDate = localStorage.getItem(this.LAST_FETCH_KEY);
    const today = this.getTodayDateString();

    // If it's a new day, fetch new quote
    if (lastFetchDate !== today) {
      console.log('🕛 New day detected, updating quote of the day...');
      this.getQuoteOfTheDay(userRole).subscribe();
    }
  }

  /**
   * Get quote by specific category (for manual selection)
   */
  getQuoteByCategory(category: string): Observable<any> {
    const url = category === 'random' 
      ? 'https://benedictocollege-quote-api.netlify.app/.netlify/functions/random'
      : `https://benedictocollege-quote-api.netlify.app/.netlify/functions/random?category=${category}`;

    console.log('🌐 Testing API call to:', url);

    return this.http.get(url).pipe(
      tap(response => {
        console.log('🔍 API Response:', response);
      }),
      catchError(error => {
        console.error(`❌ Error fetching quote for category ${category}:`, error);
        return of({ error: 'Failed to fetch quote' });
      })
    );
  }

  /**
   * Get available categories for a user role
   */
  getCategoriesForRole(userRole: 'admin' | 'faculty' | 'student'): string[] {
    return this.ROLE_CATEGORIES[userRole] || [];
  }

  /**
   * Auto-detect user role from authentication service
   */
  detectUserRole(): 'admin' | 'faculty' | 'student' {
    const currentAdmin = this.authService.getCurrentAdmin();
    
    if (currentAdmin && currentAdmin.role) {
      const role = currentAdmin.role.toLowerCase();
      
      // Map admin roles to quote categories
      if (role.includes('admin') || role.includes('librarian')) {
        return 'admin';
      } else if (role.includes('faculty') || role.includes('teacher')) {
        return 'faculty';
      }
    }
    
    // Default to student if no admin is logged in or role is unclear
    return 'student';
  }

  /**
   * Get quote of the day with auto-detected role
   */
  getAutoQuoteOfTheDay(): Observable<QuoteResponse> {
    const detectedRole = this.detectUserRole();
    console.log('🎯 Auto-detected user role for quote:', detectedRole);
    return this.getQuoteOfTheDay(detectedRole);
  }

  /**
   * Force immediate quote update (for testing)
   */
  forceImmediateUpdate(userRole: 'admin' | 'faculty' | 'student'): Observable<QuoteResponse> {
    console.log('🚀 FORCING IMMEDIATE QUOTE UPDATE FOR TESTING');
    console.log('🎯 User role:', userRole);
    console.log('🏷️ Available categories:', this.ROLE_CATEGORIES[userRole]);
    
    // Clear all cache
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LAST_FETCH_KEY);
    console.log('🗑️ Cache cleared');
    
    // Force fetch new quote
    return this.fetchNewQuoteOfTheDay(userRole);
  }

  /**
   * Test API directly (for debugging)
   */
  testApiDirectly(): Observable<any> {
    const testUrl = 'https://benedictocollege-quote-api.netlify.app/.netlify/functions/random';
    console.log(' Testing API directly:', testUrl);
    
    return this.http.get(testUrl).pipe(
      tap(response => {
        console.log('🔍 Direct API test response:', response);
        if (response) {
          console.log('📝 Quote text:', (response as any).quote || (response as any).text);
          console.log('👤 Author:', (response as any).author);
          console.log('🏷️ Category:', (response as any).category);
        }
      }),
      catchError(error => {
        console.error('❌ Direct API test failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        return of({ error: error.message });
      })
    );
  }

  /**
   * Test specific category
   */
  testCategory(category: string): Observable<any> {
    const testUrl = `https://benedictocollege-quote-api.netlify.app/.netlify/functions/random?category=${category}`;
    console.log(`🧪 Testing category "${category}":`, testUrl);
    
    return this.http.get(testUrl).pipe(
      tap(response => {
        console.log(`🔍 Category "${category}" response:`, response);
      }),
      catchError(error => {
        console.error(`❌ Category "${category}" test failed:`, error);
        return of({ error: error.message });
      })
    );
  }
}