import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ReactionSummary {
  reaction_type: string;
  reaction_count: number;
}

export interface PostReaction {
  user_id: string | number;
  user_type: 'admin' | 'student' | 'faculty';
  reaction_type: string;
  created_at: string;
}

export interface ReactionData {
  postId: number;
  totalReactions: number;
  summary: ReactionSummary[];
  reactions: PostReaction[];
}

export interface UserReactionData {
  postId: number;
  userId: string | number;
  userType: 'admin' | 'student' | 'faculty';
  hasReaction: boolean;
  reactionType: string | null;
  reactedAt: string | null;
}

export interface ReactionResponse {
  success: boolean;
  data: any;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private baseUrl = `${environment.apiUrl}/reactions`;
  private postsUrl = `${environment.apiUrl}/posts`;

  // BehaviorSubject to track reaction updates in real-time
  private reactionUpdatesSubject = new BehaviorSubject<{postId: number, reactionData: any} | null>(null);
  public reactionUpdates$ = this.reactionUpdatesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with authorization token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get authentication token from localStorage based on user type
   */
  private getAuthToken(): string | null {
    // Try different token types
    return localStorage.getItem('adminToken') || 
           localStorage.getItem('studentToken') || 
           localStorage.getItem('facultyToken') ||
           null;
  }

  /**
   * Get all reactions for a specific post
   */
  getPostReactions(postId: number): Observable<ReactionResponse> {
    return this.http.get<ReactionResponse>(`${this.baseUrl}/posts/${postId}/reactions`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Add or update a reaction to a post
   */
  reactToPost(postId: number, reactionType: string = 'heart'): Observable<ReactionResponse> {
    try {
      const headers = this.getAuthHeaders();
      const body = { reactionType };
      const url = `${this.baseUrl}/posts/${postId}/reactions`;

      console.log('🚀 ReactionService - Making POST request:');
      console.log('URL:', url);
      console.log('Headers:', headers.keys().map(key => `${key}: ${headers.get(key)}`));
      console.log('Body:', body);
      console.log('Auth Token:', this.getAuthToken());

      return this.http.post<ReactionResponse>(url, body, { headers })
        .pipe(
          tap(response => {
            console.log('✅ ReactionService - POST Response:', response);
            if (response.success) {
              // Emit reaction update for real-time updates
              this.emitReactionUpdate(postId, response.data);
            }
          }),
          catchError(error => {
            console.error('❌ ReactionService - POST Error:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            console.error('Error URL:', error.url);
            return this.handleError(error);
          })
        );
    } catch (error) {
      console.error('❌ ReactionService - Auth Error:', error);
      return throwError(() => new Error('Authentication required to react to posts'));
    }
  }

  /**
   * Get current user's reaction to a specific post
   */
  getUserReaction(postId: number): Observable<ReactionResponse> {
    try {
      const headers = this.getAuthHeaders();
      
      return this.http.get<ReactionResponse>(`${this.baseUrl}/posts/${postId}/user-reaction`, { headers })
        .pipe(
          catchError(this.handleError)
        );
    } catch (error) {
      console.error('❌ ReactionService - Auth Error for getUserReaction:', error);
      // Return a mock response when not authenticated
      return new Observable(observer => {
        observer.next({
          success: true,
          data: {
            postId,
            userId: null,
            userType: null,
            hasReaction: false,
            reactionType: null,
            reactedAt: null
          }
        });
        observer.complete();
      });
    }
  }

  /**
   * Get users who reacted to a post
   */
  getReactionUsers(postId: number, reactionType?: string): Observable<ReactionResponse> {
    let url = `${this.baseUrl}/posts/${postId}/reactions/users`;
    if (reactionType) {
      url += `?reactionType=${reactionType}`;
    }

    return this.http.get<ReactionResponse>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get all posts with reaction data
   */
  getAllPosts(): Observable<ReactionResponse> {
    return this.http.get<ReactionResponse>(`${this.postsUrl}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get a specific post with reaction data
   */
  getPost(postId: number): Observable<ReactionResponse> {
    return this.http.get<ReactionResponse>(`${this.postsUrl}/${postId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Toggle heart reaction (like/unlike)
   */
  toggleHeartReaction(postId: number): Observable<ReactionResponse> {
    return this.reactToPost(postId, 'heart');
  }

  /**
   * Emit reaction update for real-time notifications
   */
  private emitReactionUpdate(postId: number, reactionData: any): void {
    this.reactionUpdatesSubject.next({ postId, reactionData });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) {
      return false;
    }
    
    // Try to parse the token to check if it's valid
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (e) {
      // If we can't parse the token, it's invalid
      return false;
    }
  }

  /**
   * Get user type from token
   */
  getUserType(): 'admin' | 'student' | 'faculty' | null {
    if (localStorage.getItem('adminToken')) return 'admin';
    if (localStorage.getItem('studentToken')) return 'student';
    if (localStorage.getItem('facultyToken')) return 'faculty';
    return null;
  }

  /**
   * Format reaction count for display
   */
  formatReactionCount(count: number): string {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    } else {
      return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status) {
      switch (error.status) {
        case 0:
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 401:
          errorMessage = 'Please log in to react to posts';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = 'Post not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = `HTTP Error ${error.status}`;
      }
    }

    console.error('Reaction Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Clear reaction updates subject
   */
  clearReactionUpdates(): void {
    this.reactionUpdatesSubject.next(null);
  }

  /**
   * Get reaction icon based on type
   */
  getReactionIcon(reactionType: string): string {
    switch (reactionType) {
      case 'heart':
        return '❤️';
      case 'like':
        return '👍';
      case 'love':
        return '😍';
      case 'laugh':
        return '😂';
      case 'wow':
        return '😮';
      case 'sad':
        return '😢';
      case 'angry':
        return '😠';
      default:
        return '❤️';
    }
  }

  /**
   * Get reaction color based on type
   */
  getReactionColor(reactionType: string): string {
    switch (reactionType) {
      case 'heart':
        return 'text-red-500';
      case 'like':
        return 'text-blue-500';
      case 'love':
        return 'text-pink-500';
      case 'laugh':
        return 'text-yellow-500';
      case 'wow':
        return 'text-orange-500';
      case 'sad':
        return 'text-blue-400';
      case 'angry':
        return 'text-red-600';
      default:
        return 'text-red-500';
    }
  }
}