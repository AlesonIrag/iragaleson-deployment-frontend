import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuoteService } from '../../services/quote.service';
import { QuoteSchedulerService } from '../../services/quote-scheduler.service';

@Component({
  selector: 'app-quote-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Quote System Test Panel</h2>
      
      <!-- Test Controls -->
      <div class="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 class="text-lg font-semibold mb-4">Test Controls</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium mb-2">User Role:</label>
            <select [(ngModel)]="selectedRole" class="w-full p-2 border rounded">
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Category:</label>
            <select [(ngModel)]="selectedCategory" class="w-full p-2 border rounded">
              <option value="">Auto (based on role)</option>
              <option value="random">Random</option>
              <option value="teachers">Teachers</option>
              <option value="students">Students</option>
              <option value="motivation">Motivation</option>
              <option value="inspiration">Inspiration</option>
              <option value="education">Education</option>
            </select>
          </div>
          
          <div class="flex items-end">
            <button (click)="testQuote()" 
                    [disabled]="loading"
                    class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50">
              {{ loading ? 'Loading...' : 'Test Quote' }}
            </button>
          </div>
        </div>
        
        <div class="flex gap-2 flex-wrap">
          <button (click)="testApiDirectly()" 
                  class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Test API Directly
          </button>
          
          <button (click)="forceUpdate()" 
                  class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Force Daily Update
          </button>
          
          <button (click)="clearCache()" 
                  class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Clear Cache
          </button>
          
          <button (click)="showDebugInfo = !showDebugInfo" 
                  class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            {{ showDebugInfo ? 'Hide' : 'Show' }} Debug Info
          </button>
        </div>
      </div>

      <!-- Current Quote Display -->
      <div class="bg-white border rounded-lg p-6 mb-6" *ngIf="currentQuote">
        <h3 class="text-lg font-semibold mb-4">Current Quote</h3>
        <blockquote class="text-lg italic mb-4">"{{ currentQuote.text }}"</blockquote>
        
        <!-- Enhanced Author Display -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <div class="flex items-center mb-2">
            <svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span class="font-semibold text-lg text-gray-800">{{ currentQuote.author }}</span>
          </div>
          <div class="text-sm text-gray-600">
            <strong>Author Field:</strong> {{ currentQuote.author || 'Not provided' }}
          </div>
        </div>
        
        <div class="flex justify-between items-center">
          <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            {{ currentQuote.category }}
          </span>
          <span class="text-sm text-gray-500">ID: {{ currentQuote.id }}</span>
        </div>
      </div>

      <!-- Error Display -->
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" *ngIf="error">
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- Debug Information -->
      <div class="bg-gray-50 border rounded-lg p-4" *ngIf="showDebugInfo">
        <h3 class="text-lg font-semibold mb-4">Debug Information</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 class="font-medium mb-2">Cache Status:</h4>
            <p><strong>Last Fetch Date:</strong> {{ getLastFetchDate() || 'None' }}</p>
            <p><strong>Cached Quote:</strong> {{ getCachedQuote() ? 'Yes' : 'No' }}</p>
            <p><strong>Today's Date:</strong> {{ getTodayDate() }}</p>
          </div>
          
          <div>
            <h4 class="font-medium mb-2">Role Categories:</h4>
            <p><strong>Admin:</strong> {{ getRoleCategories('admin').join(', ') }}</p>
            <p><strong>Faculty:</strong> {{ getRoleCategories('faculty').join(', ') }}</p>
            <p><strong>Student:</strong> {{ getRoleCategories('student').join(', ') }}</p>
          </div>
          
          <div>
            <h4 class="font-medium mb-2">Scheduler Info:</h4>
            <p><strong>Next Update:</strong> {{ getNextUpdateTime() }}</p>
            <p><strong>Auto-detected Role:</strong> {{ getDetectedRole() }}</p>
          </div>
          
          <div>
            <h4 class="font-medium mb-2">API Endpoints:</h4>
            <p><strong>Random:</strong> /random</p>
            <p><strong>Category:</strong> /random?category=X</p>
            <p><strong>Base URL:</strong> benedictocollege-quote-api.netlify.app</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grid {
      display: grid;
    }
    .grid-cols-1 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
    @media (min-width: 768px) {
      .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `]
})
export class QuoteTestComponent implements OnInit {
  selectedRole: 'admin' | 'faculty' | 'student' = 'student';
  selectedCategory: string = '';
  currentQuote: any = null;
  loading: boolean = false;
  error: string = '';
  showDebugInfo: boolean = false;

  constructor(
    private quoteService: QuoteService,
    private quoteScheduler: QuoteSchedulerService
  ) {}

  ngOnInit(): void {
    // Load current quote on init
    this.testQuote();
  }

  testQuote(): void {
    this.loading = true;
    this.error = '';

    if (this.selectedCategory) {
      // Test specific category
      this.quoteService.getQuoteByCategory(this.selectedCategory).subscribe({
        next: (response) => {
          console.log('🔍 Raw API Response for category test:', response);
          if (response.quote) {
            this.currentQuote = {
              id: response.quote.id || Date.now(),
              text: response.quote.text || response.quote.quote || response.quote.content,
              author: this.extractAuthorFromResponse(response.quote),
              category: this.selectedCategory
            };
            console.log('👤 Extracted author:', this.currentQuote.author);
          } else {
            this.error = 'No quote received from API';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = `API Error: ${error.message || error}`;
          this.loading = false;
        }
      });
    } else {
      // Test role-based quote
      this.quoteService.getQuoteOfTheDay(this.selectedRole).subscribe({
        next: (response) => {
          console.log('🔍 Service Response for role test:', response);
          if (response.success && response.quote) {
            this.currentQuote = response.quote;
            console.log('👤 Author from service:', this.currentQuote.author);
          } else {
            this.error = response.message || 'Failed to get quote';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = `Service Error: ${error.message || error}`;
          this.loading = false;
        }
      });
    }
  }

  // Helper method to extract author from API response
  private extractAuthorFromResponse(quoteData: any): string {
    console.log('🔍 Extracting author from:', quoteData);
    
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

    console.log('⚠️ No author found, using default');
    return 'Anonymous';
  }

  forceUpdate(): void {
    this.quoteScheduler.forceUpdateQuote();
    setTimeout(() => this.testQuote(), 1000);
  }

  clearCache(): void {
    localStorage.removeItem('quote_of_the_day');
    localStorage.removeItem('quote_last_fetch');
    this.currentQuote = null;
    console.log('🗑️ Quote cache cleared');
  }

  // Debug helper methods
  getLastFetchDate(): string {
    return localStorage.getItem('quote_last_fetch') || '';
  }

  getCachedQuote(): boolean {
    return !!localStorage.getItem('quote_of_the_day');
  }

  getTodayDate(): string {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
  }

  getRoleCategories(role: 'admin' | 'faculty' | 'student'): string[] {
    return this.quoteService.getCategoriesForRole(role);
  }

  getNextUpdateTime(): string {
    return this.quoteScheduler.getNextUpdateTime();
  }

  getDetectedRole(): string {
    return this.quoteService.detectUserRole();
  }

  // Test API directly to see raw response
  testApiDirectly(): void {
    const testUrl = 'https://benedictocollege-quote-api.netlify.app/.netlify/functions/random';
    
    console.log('🧪 Testing API directly:', testUrl);
    
    fetch(testUrl)
      .then(response => response.json())
      .then(data => {
        console.log('🔍 Direct API Response:', data);
        console.log('📝 Quote object:', data.quote);
        if (data.quote) {
          console.log('👤 Author field:', data.quote.author);
          console.log('📖 Text field:', data.quote.text || data.quote.quote);
          console.log('🏷️ All fields:', Object.keys(data.quote));
        }
        
        // Display in UI
        if (data.quote) {
          this.currentQuote = {
            id: data.quote.id || Date.now(),
            text: data.quote.text || data.quote.quote || 'No text found',
            author: data.quote.author || 'No author found',
            category: 'direct-test'
          };
        }
      })
      .catch(error => {
        console.error('❌ Direct API test failed:', error);
        this.error = `Direct API test failed: ${error.message}`;
      });
  }
}