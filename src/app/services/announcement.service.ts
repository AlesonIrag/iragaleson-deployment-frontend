import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'students' | 'faculty';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface NewsItem {
  id?: number;
  text: string;
  type: 'info' | 'warning' | 'event';
  color: 'red' | 'green' | 'blue' | 'yellow' | 'purple';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private announcementsSubject = new BehaviorSubject<Announcement[]>([]);
  private newsSubject = new BehaviorSubject<NewsItem[]>([]);

  public announcements$ = this.announcementsSubject.asObservable();
  public news$ = this.newsSubject.asObservable();

  private readonly API_URL = 'http://localhost:3000/api/v1';

  constructor(private apiService: ApiService, private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load data from database API
    this.loadAnnouncementsFromAPI();
    this.loadNewsFromAPI();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  private loadAnnouncementsFromAPI(): void {
    this.http.get<any>(`${this.API_URL}/posts`, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Filter only announcements for this method
          return response.data
            .filter((post: any) => post.Type === 'announcement')
            .map((post: any) => ({
              id: post.PostID,
              title: post.Title,
              content: post.Content,
              type: this.mapPostTypeToAnnouncementType(post.Type),
              priority: post.Priority || 'medium',
              targetAudience: post.TargetAudience || 'all',
              isActive: post.IsActive === 1,
              createdAt: post.CreatedAt,
              updatedAt: post.UpdatedAt,
              createdBy: 'Admin'
            }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading announcements from API:', error);
        return of(this.getDefaultAnnouncements());
      })
    ).subscribe(announcements => {
      this.announcementsSubject.next(announcements);
    });
  }

  private loadNewsFromAPI(): void {
    this.http.get<any>(`${this.API_URL}/posts`, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Filter only news for this method
          return response.data
            .filter((post: any) => post.Type === 'news')
            .map((post: any) => ({
              id: post.PostID,
              text: post.Content,
              type: this.mapPostTypeToNewsType(post.Type),
              color: post.Color || this.getNewsColorByType(post.Type), // Use stored color or fallback
              isActive: post.IsActive === 1,
              createdAt: post.CreatedAt,
              updatedAt: post.UpdatedAt
            }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error loading news from API:', error);
        return of(this.getDefaultNews());
      })
    ).subscribe(news => {
      this.newsSubject.next(news);
    });
  }

  private mapPostTypeToAnnouncementType(postType: string): 'info' | 'warning' | 'success' | 'error' {
    switch (postType) {
      case 'announcement': return 'info';
      case 'event': return 'success';
      case 'other': return 'warning';
      default: return 'info';
    }
  }

  private mapPostTypeToNewsType(postType: string): 'info' | 'warning' | 'event' {
    switch (postType) {
      case 'news': return 'info';
      case 'event': return 'event';
      default: return 'info';
    }
  }

  private getNewsColorByType(type: string): 'red' | 'green' | 'blue' | 'yellow' | 'purple' {
    switch (type) {
      case 'news': return 'blue';
      case 'event': return 'green';
      case 'announcement': return 'purple';
      default: return 'blue';
    }
  }

  private getDefaultAnnouncements(): Announcement[] {
    const now = new Date();
    return [
      {
        id: 1,
        title: 'Library Hours Update',
        content: 'Return books by July 10 to avoid fees.',
        type: 'warning',
        priority: 'high',
        targetAudience: 'all',
        isActive: true,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Admin'
      }
    ];
  }

  private getDefaultNews(): NewsItem[] {
    const now = new Date();
    return [
      {
        id: 1,
        text: 'Welcome to the Library Management System!',
        type: 'info',
        color: 'blue',
        isActive: true,
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Announcement CRUD operations
  getAnnouncements(): Observable<Announcement[]> {
    return this.announcements$;
  }

  getActiveAnnouncements(): Observable<Announcement[]> {
    return new Observable(observer => {
      this.announcements$.subscribe(announcements => {
        observer.next(announcements.filter(a => a.isActive));
      });
    });
  }

  getAnnouncementsByAudience(audience: 'all' | 'students' | 'faculty'): Observable<Announcement[]> {
    return new Observable(observer => {
      this.announcements$.subscribe(announcements => {
        observer.next(announcements.filter(a => 
          a.isActive && (a.targetAudience === 'all' || a.targetAudience === audience)
        ));
      });
    });
  }

  addAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Observable<any> {
    const postData = {
      title: announcement.title,
      content: announcement.content,
      type: 'announcement',
      priority: announcement.priority || 'medium'
    };

    return this.http.post<any>(`${this.API_URL}/posts`, postData, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success) {
          // Reload announcements from API to get the latest data
          this.loadAnnouncementsFromAPI();
          return response;
        }
        throw new Error('Failed to create announcement');
      }),
      catchError(error => {
        console.error('Error creating announcement:', error);
        // Fallback to local storage if API fails
        const currentAnnouncements = this.announcementsSubject.value;
        const newId = Math.max(...currentAnnouncements.map(a => a.id || 0), 0) + 1;

        const newAnnouncement: Announcement = {
          ...announcement,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updatedAnnouncements = [newAnnouncement, ...currentAnnouncements];
        this.announcementsSubject.next(updatedAnnouncements);

        return of({ success: true, data: newAnnouncement });
      })
    );
  }

  updateAnnouncement(id: number, updates: Partial<Announcement>): Observable<any> {
    const updateData = {
      title: updates.title,
      content: updates.content,
      type: 'announcement',
      priority: updates.priority || 'medium'
    };

    return this.http.put<any>(`${this.API_URL}/posts/${id}`, updateData, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success) {
          // Reload announcements from API to get the latest data
          this.loadAnnouncementsFromAPI();
          return response;
        }
        throw new Error('Failed to update announcement');
      }),
      catchError(error => {
        console.error('Error updating announcement:', error);
        // Fallback to local update if API fails
        const currentAnnouncements = this.announcementsSubject.value;
        const updatedAnnouncements = currentAnnouncements.map(announcement =>
          announcement.id === id
            ? { ...announcement, ...updates, updatedAt: new Date().toISOString() }
            : announcement
        );

        this.announcementsSubject.next(updatedAnnouncements);
        return of({ success: true });
      })
    );
  }

  deleteAnnouncement(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/posts/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success) {
          // Reload announcements from API to get the latest data
          this.loadAnnouncementsFromAPI();
          return response;
        }
        throw new Error('Failed to delete announcement');
      }),
      catchError(error => {
        console.error('Error deleting announcement:', error);
        // Fallback to local delete if API fails
        const currentAnnouncements = this.announcementsSubject.value;
        const updatedAnnouncements = currentAnnouncements.filter(a => a.id !== id);

        this.announcementsSubject.next(updatedAnnouncements);
        return of({ success: true });
      })
    );
  }

  // News CRUD operations
  getNews(): Observable<NewsItem[]> {
    return this.news$;
  }

  getActiveNews(): Observable<NewsItem[]> {
    return new Observable(observer => {
      this.news$.subscribe(news => {
        observer.next(news.filter(n => n.isActive));
      });
    });
  }

  addNews(newsItem: Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>): Observable<any> {
    const postData = {
      title: `News: ${newsItem.text.substring(0, 50)}...`, // Create a title from the text
      content: newsItem.text,
      type: 'news',
      priority: 'medium',
      color: newsItem.color || 'blue' // Include the color field
    };

    return this.http.post<any>(`${this.API_URL}/posts`, postData, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success) {
          // Reload news from API to get the latest data
          this.loadNewsFromAPI();
          return response;
        }
        throw new Error('Failed to create news item');
      }),
      catchError(error => {
        console.error('Error creating news item:', error);
        // Fallback to local storage if API fails
        const currentNews = this.newsSubject.value;
        const newId = Math.max(...currentNews.map(n => n.id || 0), 0) + 1;

        const newNewsItem: NewsItem = {
          ...newsItem,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updatedNews = [newNewsItem, ...currentNews];
        this.newsSubject.next(updatedNews);

        return of({ success: true, data: newNewsItem });
      })
    );
  }

  updateNews(id: number, updates: Partial<NewsItem>): Observable<any> {
    const updateData = {
      title: `News: ${updates.text?.substring(0, 50)}...`,
      content: updates.text,
      type: 'news',
      priority: 'medium',
      color: updates.color || 'blue' // Include the color field
    };

    return this.http.put<any>(`${this.API_URL}/posts/${id}`, updateData, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success) {
          // Reload news from API to get the latest data
          this.loadNewsFromAPI();
          return response;
        }
        throw new Error('Failed to update news item');
      }),
      catchError(error => {
        console.error('Error updating news item:', error);
        // Fallback to local update if API fails
        const currentNews = this.newsSubject.value;
        const updatedNews = currentNews.map(newsItem =>
          newsItem.id === id
            ? { ...newsItem, ...updates, updatedAt: new Date().toISOString() }
            : newsItem
        );

        this.newsSubject.next(updatedNews);
        return of({ success: true });
      })
    );
  }

  deleteNews(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/posts/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success) {
          // Reload news from API to get the latest data
          this.loadNewsFromAPI();
          return response;
        }
        throw new Error('Failed to delete news item');
      }),
      catchError(error => {
        console.error('Error deleting news item:', error);
        // Fallback to local delete if API fails
        const currentNews = this.newsSubject.value;
        const updatedNews = currentNews.filter(n => n.id !== id);

        this.newsSubject.next(updatedNews);
        return of({ success: true });
      })
    );
  }

  // Refresh data from API
  refreshData(): void {
    this.loadAnnouncementsFromAPI();
    this.loadNewsFromAPI();
  }

  // Utility methods
  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  getFormattedDateTime(dateString: string): string {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    return `${formattedDate} at ${formattedTime}`;
  }

  // Image handling methods
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB'
      };
    }

    return {
      isValid: true
    };
  }
}
