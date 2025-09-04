import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactionService } from '../../services/reaction.service';
import { Subscription, timer } from 'rxjs';

export interface Post {
  id: number;
  title?: string;
  content?: string;
  type?: string;
  total_reactions?: number;
  reactions?: { [key: string]: number };
}

export interface ReactionChangeEvent {
  postId: number;
  action: 'added' | 'removed' | 'updated';
  reactionType: string;
  totalReactions: number;
}

@Component({
  selector: 'app-post-reactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="post-reactions-container flex items-center space-x-3 mt-3">
      <!-- Heart Button -->
      <button
        (click)="toggleHeartReaction()"
        [disabled]="isLoading || !isAuthenticated"
        class="heart-btn p-2 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        [ngClass]="{
          'bg-red-500 hover:bg-red-600': hasReacted,
          'bg-gray-100 hover:bg-gray-200 border border-gray-300': !hasReacted && !isDarkMode,
          'bg-gray-700 hover:bg-gray-600 border border-gray-600': !hasReacted && isDarkMode,
          'heart-pop': showAnimation
        }"
        [attr.aria-label]="hasReacted ? 'Unlike this post' : 'Like this post'"
        [title]="!isAuthenticated ? 'Please log in to react' : (hasReacted ? 'Unlike' : 'Like')"
      >
        <!-- Heart Icon -->
        <div class="relative">
          <svg 
            class="heart-icon w-5 h-5 transition-all duration-200"
            [ngClass]="{
              'text-white': hasReacted,
              'text-gray-500': !hasReacted && !isDarkMode,
              'text-gray-300': !hasReacted && isDarkMode
            }"
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>

          <!-- Loading Spinner -->
          <div 
            *ngIf="isLoading" 
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
          </div>

          <!-- Animation Hearts -->
          <div 
            *ngIf="showAnimation"
            class="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse"
          >
            <svg 
              class="w-6 h-6 text-red-400"
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
      </button>

      <!-- Like Count Display -->
      <div 
        *ngIf="reactionCount > 0" 
        class="like-count flex items-center space-x-1 text-sm"
        [ngClass]="{
          'text-gray-700': !isDarkMode,
          'text-gray-300': isDarkMode
        }"
      >
        <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <span class="font-medium">{{ formattedCount }}</span>
      </div>

      <!-- Login Prompt (only show if not authenticated and no reactions) -->
      <div 
        *ngIf="!isAuthenticated && reactionCount === 0"
        class="text-xs opacity-75"
        [ngClass]="{
          'text-gray-500': !isDarkMode,
          'text-gray-400': isDarkMode
        }"
      >
        Log in to react
      </div>
    </div>
  `,
  styles: [`
    .heart-btn {
      min-width: 2.5rem;
      min-height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s ease;
    }

    .heart-btn:hover {
      transform: scale(1.1);
    }

    .heart-btn:active {
      transform: scale(0.95);
    }

    .heart-icon {
      transition: all 0.2s ease;
    }

    .like-count {
      user-select: none;
    }

    /* Accessibility */
    .heart-btn:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Animation for heart pop */
    @keyframes heartPop {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    .heart-pop {
      animation: heartPop 0.3s ease-out;
    }
  `]
})
export class PostReactionsComponent implements OnInit, OnDestroy {
  @Input() post!: Post;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showText: boolean = true;
  @Input() isDarkMode: boolean = false;
  @Output() reactionChanged = new EventEmitter<ReactionChangeEvent>();

  // Component state
  hasReacted: boolean = false;
  reactionCount: number = 0;
  isLoading: boolean = false;
  isAuthenticated: boolean = false;
  showAnimation: boolean = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(private reactionService: ReactionService) {}

  ngOnInit(): void {
    this.isAuthenticated = this.reactionService.isAuthenticated();
    
    // Enhanced debugging for authentication
    console.log('🔍 PostReactionsComponent ngOnInit debug:');
    console.log('- Component initialized for post:', this.post?.id);
    console.log('- Is authenticated:', this.isAuthenticated);
    console.log('- User type:', this.reactionService.getUserType());
    
    const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('studentToken') || 
                  localStorage.getItem('facultyToken');
    console.log('- Token available:', !!token);
    
    if (this.post) {
      this.reactionCount = this.post.total_reactions || 0;
      console.log('- Initial reaction count:', this.reactionCount);
      this.loadUserReaction();
      this.setupReactionUpdates();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Toggle heart reaction
   */
  async toggleHeartReaction(): Promise<void> {
    // Enhanced debugging
    console.log('🔍 Heart reaction toggle debug info:');
    console.log('- Post ID:', this.post.id);
    console.log('- Is Authenticated:', this.isAuthenticated);
    console.log('- Is Loading:', this.isLoading);
    console.log('- Current hasReacted:', this.hasReacted);
    console.log('- Current reactionCount:', this.reactionCount);
    
    // Check authentication token
    const token = localStorage.getItem('adminToken') || 
                  localStorage.getItem('studentToken') || 
                  localStorage.getItem('facultyToken');
    console.log('- Auth token present:', !!token);
    console.log('- Auth token preview:', token ? token.substring(0, 50) + '...' : 'None');

    if (!this.isAuthenticated || this.isLoading) {
      console.log('❌ Cannot toggle reaction - authentication or loading issue');
      
      // Show user-friendly message
      if (!this.isAuthenticated) {
        console.log('User not authenticated, showing login prompt');
        // Instead of alert, just log and return silently
        // The heart will remain gray and non-functional
        return;
      }
      return;
    }

    console.log('🚀 Starting heart reaction toggle for post:', this.post.id);
    this.isLoading = true;

    try {
      const apiUrl = `http://localhost:3000/api/v1/reactions/posts/${this.post.id}/reactions`;
      console.log('📤 Making API call to:', apiUrl);
      
      const response = await this.reactionService.toggleHeartReaction(this.post.id).toPromise();
      
      console.log('📥 API Response:', response);
      
      if (response?.success) {
        const { action, reactionType } = response.data;
        
        // Update local state
        if (action === 'added') {
          this.hasReacted = true;
          this.reactionCount++;
          this.showHeartAnimation();
          console.log('✅ Heart reaction added - hasReacted:', this.hasReacted);
        } else if (action === 'removed') {
          this.hasReacted = false;
          this.reactionCount = Math.max(0, this.reactionCount - 1);
          console.log('❌ Heart reaction removed - hasReacted:', this.hasReacted);
        }

        // Emit change event
        this.reactionChanged.emit({
          postId: this.post.id,
          action,
          reactionType,
          totalReactions: this.reactionCount
        });
      } else {
        console.error('❌ API call failed:', response);
        alert('Failed to update reaction. Please try again.');
      }
    } catch (error: any) {
      console.error('💥 Error toggling reaction:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        status: error?.status || 'No status',
        url: error?.url || 'No URL',
        error: error
      });
      
      // Log error but don't show intrusive alerts
      if (error?.status === 401) {
        console.log('Authentication failed - user needs to log in');
      } else if (error?.status === 404) {
        console.log('Post not found - may need page refresh');
      } else {
        console.log('Network error - connection issue');
      }
      
      // Set authentication to false if we get auth errors
      if (error?.status === 401) {
        this.isAuthenticated = false;
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load current user's reaction status
   */
  private async loadUserReaction(): Promise<void> {
    if (!this.isAuthenticated) {
      return;
    }

    try {
      const response = await this.reactionService.getUserReaction(this.post.id).toPromise();
      
      if (response?.success) {
        this.hasReacted = response.data.hasReaction && response.data.reactionType === 'heart';
        console.log('🔄 User reaction loaded - hasReacted:', this.hasReacted, 'for post:', this.post.id);
      }
    } catch (error) {
      console.error('Error loading user reaction:', error);
    }
  }

  /**
   * Load users who reacted to this post (for count only)
   */
  private async loadReactionUsers(): Promise<void> {
    // Not needed anymore - we just use the total count from the post
  }

  /**
   * Setup real-time reaction updates
   */
  private setupReactionUpdates(): void {
    const subscription = this.reactionService.reactionUpdates$.subscribe(update => {
      if (update && update.postId === this.post.id) {
        this.loadUserReaction();
        
        // Update reaction count from server
        this.reactionService.getPostReactions(this.post.id).subscribe(response => {
          if (response?.success) {
            this.reactionCount = response.data.totalReactions || 0;
          }
        });
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Show heart animation effect
   */
  private showHeartAnimation(): void {
    this.showAnimation = true;
    
    const animationSubscription = timer(800).subscribe(() => {
      this.showAnimation = false;
    });

    this.subscriptions.push(animationSubscription);
  }

  /**
   * Get formatted reaction count
   */
  get formattedCount(): string {
    return this.reactionService.formatReactionCount(this.reactionCount);
  }
}