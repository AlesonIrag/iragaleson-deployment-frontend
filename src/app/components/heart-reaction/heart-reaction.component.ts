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
  selector: 'app-heart-reaction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heart-reaction-container relative inline-flex items-center">
      <!-- Heart Button -->
      <button
        (click)="toggleReaction()"
        [disabled]="isLoading || !isAuthenticated"
        [class]="getHeartButtonClasses()"
        class="heart-button relative flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        [attr.aria-label]="hasReacted ? 'Unlike this post' : 'Like this post'"
        [title]="!isAuthenticated ? 'Please log in to react' : (hasReacted ? 'Unlike' : 'Like')"
      >
        <!-- Heart Icon -->
        <svg 
          class="heart-icon w-6 h-6 transition-all duration-300"
          [class]="getHeartIconClasses()"
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
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
        </div>

        <!-- Animation Overlay -->
        <div 
          *ngIf="showHeartAnimation"
          class="heart-animation absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <svg 
            class="w-8 h-8 text-red-500 animate-ping"
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </button>

      <!-- Reaction Count -->
      <span 
        *ngIf="reactionCount > 0"
        [class]="getCountClasses()"
        class="reaction-count ml-2 text-sm font-medium transition-all duration-300"
        [title]="getCountTooltip()"
      >
        {{ formattedCount }}
      </span>

      <!-- Users who reacted (hover tooltip) -->
      <div 
        *ngIf="showUsersTooltip && reactionUsers.length > 0"
        class="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg z-50 min-w-max"
      >
        <div class="max-h-32 overflow-y-auto">
          <div *ngFor="let user of reactionUsers.slice(0, 10)" class="whitespace-nowrap">
            {{ user.user_name }}
          </div>
          <div *ngIf="reactionUsers.length > 10" class="text-gray-300 italic">
            and {{ reactionUsers.length - 10 }} more...
          </div>
        </div>
        <!-- Tooltip arrow -->
        <div class="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  `,
  styles: [`
    .heart-button {
      min-width: 2.5rem;
      min-height: 2.5rem;
      border-radius: 50%;
      position: relative;
      overflow: hidden;
    }

    .heart-button:hover .heart-icon {
      transform: scale(1.1);
    }

    .heart-button:active {
      transform: scale(0.95);
    }

    .heart-animation {
      animation: heartPulse 0.6s ease-out;
    }

    @keyframes heartPulse {
      0% {
        transform: scale(0.8);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    .reaction-count {
      user-select: none;
    }

    /* Accessibility improvements */
    .heart-button:focus-visible {
      outline: 2px solid #ef4444;
      outline-offset: 2px;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .bg-gray-900 {
        background-color: #1f2937;
      }
    }
  `]
})
export class HeartReactionComponent implements OnInit, OnDestroy {
  @Input() post!: Post;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showCount: boolean = true;
  @Input() disabled: boolean = false;
  @Output() reactionChanged = new EventEmitter<ReactionChangeEvent>();

  // Component state
  hasReacted: boolean = false;
  reactionCount: number = 0;
  isLoading: boolean = false;
  isAuthenticated: boolean = false;
  showHeartAnimation: boolean = false;
  showUsersTooltip: boolean = false;
  reactionUsers: any[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(private reactionService: ReactionService) {}

  ngOnInit(): void {
    // Check authentication status
    this.isAuthenticated = this.reactionService.isAuthenticated();
    
    if (this.post) {
      this.reactionCount = this.post.total_reactions || 0;
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
  async toggleReaction(): Promise<void> {
    // Check if user can react
    if (!this.isAuthenticated || this.isLoading || this.disabled) {
      console.log('Cannot toggle reaction:', {
        isAuthenticated: this.isAuthenticated,
        isLoading: this.isLoading,
        disabled: this.disabled
      });
      return;
    }

    this.isLoading = true;

    try {
      console.log('Toggling reaction for post:', this.post.id);
      const response = await this.reactionService.toggleHeartReaction(this.post.id).toPromise();
      
      console.log('Reaction response:', response);
      
      if (response?.success) {
        const { action, reactionType } = response.data;
        
        // Update local state
        if (action === 'added') {
          this.hasReacted = true;
          this.reactionCount++;
          this.showHeartAnimationEffect();
        } else if (action === 'removed') {
          this.hasReacted = false;
          this.reactionCount = Math.max(0, this.reactionCount - 1);
        }

        // Emit change event
        this.reactionChanged.emit({
          postId: this.post.id,
          action,
          reactionType,
          totalReactions: this.reactionCount
        });

        // Load users who reacted
        this.loadReactionUsers();
      } else {
        console.error('Reaction API returned failure:', response);
        // Show user-friendly error message
        alert('Failed to update reaction. Please try again.');
      }
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      // Handle specific error cases
      if (error?.status === 401) {
        alert('Please log in to react to posts.');
        this.isAuthenticated = false;
      } else {
        alert('Failed to update reaction. Please try again.');
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
      }
    } catch (error) {
      console.error('Error loading user reaction:', error);
    }
  }

  /**
   * Load users who reacted to this post
   */
  private async loadReactionUsers(): Promise<void> {
    try {
      const response = await this.reactionService.getReactionUsers(this.post.id, 'heart').toPromise();
      
      if (response?.success) {
        this.reactionUsers = response.data.users || [];
      }
    } catch (error) {
      console.error('Error loading reaction users:', error);
    }
  }

  /**
   * Setup real-time reaction updates
   */
  private setupReactionUpdates(): void {
    const subscription = this.reactionService.reactionUpdates$.subscribe(update => {
      if (update && update.postId === this.post.id) {
        // Refresh reaction data
        this.loadUserReaction();
        this.loadReactionUsers();
        
        // Update reaction count from post reactions
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
  private showHeartAnimationEffect(): void {
    this.showHeartAnimation = true;
    
    // Hide animation after duration
    const animationSubscription = timer(600).subscribe(() => {
      this.showHeartAnimation = false;
    });

    this.subscriptions.push(animationSubscription);
  }

  /**
   * Get heart button CSS classes
   */
  getHeartButtonClasses(): string {
    const baseClasses = 'p-2 rounded-full border-none bg-transparent';
    const sizeClasses = {
      sm: 'p-1',
      md: 'p-2',
      lg: 'p-3'
    };
    
    const stateClasses = this.hasReacted 
      ? 'text-red-500 hover:bg-red-50' 
      : 'text-gray-400 hover:bg-gray-50 hover:text-red-500';

    return `${baseClasses} ${sizeClasses[this.size]} ${stateClasses}`;
  }

  /**
   * Get heart icon CSS classes
   */
  getHeartIconClasses(): string {
    return this.hasReacted ? 'text-red-500' : 'text-gray-400';
  }

  /**
   * Get count CSS classes
   */
  getCountClasses(): string {
    return this.hasReacted ? 'text-red-500' : 'text-gray-600';
  }

  /**
   * Get formatted reaction count
   */
  get formattedCount(): string {
    return this.reactionService.formatReactionCount(this.reactionCount);
  }

  /**
   * Get count tooltip text
   */
  getCountTooltip(): string {
    if (this.reactionCount === 0) {
      return 'No reactions';
    } else if (this.reactionCount === 1) {
      return '1 person reacted';
    } else {
      return `${this.reactionCount} people reacted`;
    }
  }

  /**
   * Handle mouse enter on count
   */
  onCountMouseEnter(): void {
    if (this.reactionCount > 0) {
      this.showUsersTooltip = true;
      this.loadReactionUsers();
    }
  }

  /**
   * Handle mouse leave on count
   */
  onCountMouseLeave(): void {
    this.showUsersTooltip = false;
  }
}