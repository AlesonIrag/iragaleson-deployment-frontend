import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AnnouncementService, Announcement, NewsItem } from '../../services/announcement.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, ToastComponent],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit, OnDestroy {

  randomFact: string = 'Loading...';
  factError: string | null = null;

  // Announcement management
  announcements: Announcement[] = [];
  newsItems: NewsItem[] = [];
  private subscriptions: Subscription[] = [];

  // Modal states
  showAddAnnouncementModal = false;
  showEditAnnouncementModal = false;
  showAddNewsModal = false;
  showEditNewsModal = false;
  showDeleteConfirmModal = false;

  // Form data
  announcementForm: Partial<Announcement> = {
    title: '',
    content: '',
    type: 'info',
    priority: 'medium',
    targetAudience: 'all',
    isActive: true
  };

  newsForm: Partial<NewsItem> = {
    text: '',
    type: 'info',
    color: 'blue',
    isActive: true
  };

  selectedItem: Announcement | NewsItem | null = null;
  deleteType: 'announcement' | 'news' = 'announcement';

  constructor(
    private themeService: ThemeService,
    private http: HttpClient,
    private announcementService: AnnouncementService,
    private toastService: ToastService
  ) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    this.loadRandomFact();
    this.loadAnnouncements();
    this.loadNews();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAnnouncements(): void {
    const sub = this.announcementService.getAnnouncements().subscribe(announcements => {
      this.announcements = announcements;
    });
    this.subscriptions.push(sub);
  }

  private loadNews(): void {
    const sub = this.announcementService.getNews().subscribe(news => {
      this.newsItems = news;
    });
    this.subscriptions.push(sub);
  }

  loadRandomFact(): void {
    this.http.get<any>('https://uselessfacts.jsph.pl/api/v2/facts/random').subscribe({
      next: (data) => {
        this.randomFact = data.text;
      },
      error: (error) => {
        this.factError = 'Failed to load a fact. Please try again later.';
        this.randomFact = 'Could not fetch a fact at this time.';
        console.error('Error fetching random fact:', error);
      }
    });
  }

  getTextClasses(): string {
    return this.themeService.getTextClasses();
  }

  getSecondaryTextClasses(): string {
    return this.themeService.getSecondaryTextClasses();
  }

  getCardClasses(): string {
    return this.themeService.getCardClasses();
  }

  // Announcement Management Methods
  openAddAnnouncementModal(): void {
    this.announcementForm = {
      title: '',
      content: '',
      type: 'info',
      priority: 'medium',
      targetAudience: 'all',
      isActive: true
    };
    this.showAddAnnouncementModal = true;
  }

  openEditAnnouncementModal(announcement: Announcement): void {
    this.announcementForm = { ...announcement };
    this.selectedItem = announcement;
    this.showEditAnnouncementModal = true;
  }

  closeAnnouncementModals(): void {
    this.showAddAnnouncementModal = false;
    this.showEditAnnouncementModal = false;
    this.selectedItem = null;
  }

  saveAnnouncement(): void {
    if (!this.announcementForm.title?.trim() || !this.announcementForm.content?.trim()) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    if (this.showEditAnnouncementModal && this.selectedItem) {
      this.announcementService.updateAnnouncement(this.selectedItem.id!, this.announcementForm).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Announcement updated successfully');
            this.closeAnnouncementModals();
          }
        },
        error: (error) => {
          console.error('Error updating announcement:', error);
          this.toastService.error('Failed to update announcement');
        }
      });
    } else {
      this.announcementService.addAnnouncement(this.announcementForm as Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Announcement created successfully');
            this.closeAnnouncementModals();
          }
        },
        error: (error) => {
          console.error('Error creating announcement:', error);
          this.toastService.error('Failed to create announcement');
        }
      });
    }
  }

  // News Management Methods
  openAddNewsModal(): void {
    this.newsForm = {
      text: '',
      type: 'info',
      color: 'blue',
      isActive: true
    };
    this.showAddNewsModal = true;
  }

  openEditNewsModal(newsItem: NewsItem): void {
    this.newsForm = { ...newsItem };
    this.selectedItem = newsItem;
    this.showEditNewsModal = true;
  }

  closeNewsModals(): void {
    this.showAddNewsModal = false;
    this.showEditNewsModal = false;
    this.selectedItem = null;
  }

  saveNews(): void {
    if (!this.newsForm.text?.trim()) {
      this.toastService.error('Please enter news text');
      return;
    }

    if (this.showEditNewsModal && this.selectedItem) {
      this.announcementService.updateNews(this.selectedItem.id!, this.newsForm).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('News updated successfully');
            this.closeNewsModals();
          }
        },
        error: (error) => {
          console.error('Error updating news:', error);
          this.toastService.error('Failed to update news');
        }
      });
    } else {
      this.announcementService.addNews(this.newsForm as Omit<NewsItem, 'id' | 'createdAt' | 'updatedAt'>).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('News created successfully');
            this.closeNewsModals();
          }
        },
        error: (error) => {
          console.error('Error creating news:', error);
          this.toastService.error('Failed to create news');
        }
      });
    }
  }

  // Delete Methods
  openDeleteConfirm(item: Announcement | NewsItem, type: 'announcement' | 'news'): void {
    this.selectedItem = item;
    this.deleteType = type;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirmModal = false;
    this.selectedItem = null;
  }

  confirmDelete(): void {
    if (!this.selectedItem) return;

    if (this.deleteType === 'announcement') {
      this.announcementService.deleteAnnouncement(this.selectedItem.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Announcement deleted successfully');
            this.closeDeleteConfirm();
          }
        },
        error: (error) => {
          console.error('Error deleting announcement:', error);
          this.toastService.error('Failed to delete announcement');
        }
      });
    } else {
      this.announcementService.deleteNews(this.selectedItem.id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('News deleted successfully');
            this.closeDeleteConfirm();
          }
        },
        error: (error) => {
          console.error('Error deleting news:', error);
          this.toastService.error('Failed to delete news');
        }
      });
    }
  }

  // Utility Methods
  getTimeAgo(dateString: string): string {
    return this.announcementService.getTimeAgo(dateString);
  }

  getFormattedDate(dateString: string): string {
    return this.announcementService.getFormattedDate(dateString);
  }

  getFormattedDateTime(dateString: string): string {
    return this.announcementService.getFormattedDateTime(dateString);
  }

  getActiveAnnouncements(): Announcement[] {
    return this.announcements.filter(a => a.isActive);
  }

  getActiveNews(): NewsItem[] {
    return this.newsItems.filter(n => n.isActive);
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'warning': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'success': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  }

  getNewsColor(color: string): string {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  }


}
