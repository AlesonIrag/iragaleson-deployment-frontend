import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { WeatherLoggerService } from '../services/weather-logger.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { QuoteService, Quote } from '../services/quote.service';
import { NotificationService } from '../services/notification.service';
import { OverdueService } from '../services/overdue.service';

interface WeatherResponse {
  success: boolean;
  data: {
    temperature: number;
    location: string;
    condition: string;
    description: string;
    icon: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    timestamp: string;
    fallback?: boolean;
  };
  message?: string;
}

interface LibraryStats {
  books: number;
  members: number;
  activeToday: number;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') chatMessagesRef!: ElementRef;
  @ViewChild('notificationButton') notificationButtonRef!: ElementRef;

  private weatherSubscription?: Subscription;
  private statsSubscription?: Subscription;

  // Mobile menu state
  isMobileMenuOpen: boolean = false;

  // Navigation collapse state
  isLibraryManagementCollapsed: boolean = false;
  isUserManagementCollapsed: boolean = false;
  isSystemAdminCollapsed: boolean = false;
  isReportsCollapsed: boolean = false;

  // Sidebar visibility state
  isSidebarHidden: boolean = false;

  // Active section tracking
  activeSection: string = 'overview';

  // Logout modal state
  showLogoutModal: boolean = false;

  // Profile modal state
  showProfileModal: boolean = false;
  profileModalTop: string = '70px';
  profileModalRight: string = '280px';

  @ViewChild('profileButton', { static: false }) profileButton!: ElementRef;

  // User profile data
  currentUserProfilePhoto: string = '';
  currentUserInitial: string = 'A';

  // Chat widget state
  isChatOpen: boolean = false;
  showTooltip: boolean = false;
  chatInput: string = '';
  isTyping: boolean = false;
  avatarError: boolean = false;
  hasUnreadMessages: boolean = false;
  unreadCount: number = 0;

  // Weather data
  temperature: string = '31°C';
  location: string = 'Cebu City';
  weatherIcon: string = 'sunny';

  // Library stats
  stats: LibraryStats = {
    books: 3456,
    members: 1230,
    activeToday: 87
  };

  // News and announcements
  latestNews = [
    { text: 'Library closed on July 12.', type: 'warning', color: 'red' },
    { text: 'New Science books available!', type: 'info', color: 'green' },
    { text: 'Join the Reading Challenge.', type: 'event', color: 'blue' }
  ];

  announcements = [
    {
      text: 'Return books by July 10 to avoid fees.',
      time: '2 hours ago',
      icon: 'megaphone'
    }
  ];

  // Chat messages
  chatMessages: ChatMessage[] = [];

  // Quote of the Day properties
  currentQuote: Quote | null = null;
  isQuoteLoading: boolean = false;
  quoteError: string | null = null;
  private quoteSubscription?: Subscription;

  // Random Fact properties
  currentFact: any = null;
  isFactLoading: boolean = false;
  factError: string | null = null;

  // Notification properties
  notifications: any[] = [];
  adminNotifications: any[] = [];
  unreadNotificationCount: number = 0;
  showNotificationDropdown: boolean = false;
  notificationDropdownPosition = { top: 0, right: 0 };

  constructor(
    private http: HttpClient,
    private weatherLogger: WeatherLoggerService,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private quoteService: QuoteService,
    private notificationService: NotificationService,
    private overdueService: OverdueService
  ) {}

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  async ngOnInit(): Promise<void> {
    console.log('🎯 Dashboard component initialized successfully!');
    console.log('📊 Loading dashboard data...');

    // Check current route and redirect to overview if no specific child route
    const currentUrl = this.router.url;
    if (currentUrl === '/dashboard') {
      this.router.navigate(['/dashboard/overview']);
      return;
    }

    // Initialize sidebar visibility based on current route
    this.initializeSidebarVisibility();

    // Load user profile data
    this.loadUserProfileData();

    // Perform startup tests and logging
    await this.weatherLogger.performStartupTests();

    this.loadWeatherData();
    this.startStatsUpdates();
    this.animateCounters();
    
    // Load quote of the day (will use cache if available)
    this.loadQuoteOfTheDay();

    // Initialize notifications
    this.initializeNotifications();
    
    // Load random fact
    this.loadRandomFact();

    // Update weather every 10 minutes
    this.weatherSubscription = interval(600000).subscribe(() => {
      this.weatherLogger.info('Scheduled weather update triggered');
      this.loadWeatherData();
    });

    // Update stats every 30 seconds
    this.statsSubscription = interval(30000).subscribe(() => {
      this.updateStats();
    });
  }

  private initializeSidebarVisibility(): void {
    // Set sidebar visibility based on current route
    const currentUrl = this.router.url;
    console.log('Initializing sidebar visibility for URL:', currentUrl);
    
    // Show sidebar only for overview page, hide for all other pages
    this.isSidebarHidden = !currentUrl.includes('/dashboard/overview');
    
    // Set active section based on current route
    if (currentUrl.includes('/dashboard/books')) {
      this.activeSection = 'books';
    } else if (currentUrl.includes('/dashboard/cataloging')) {
      this.activeSection = 'cataloging';
    } else if (currentUrl.includes('/dashboard/archived-books')) {
      this.activeSection = 'archived-books';
    } else if (currentUrl.includes('/dashboard/students')) {
      this.activeSection = 'students';
    } else if (currentUrl.includes('/dashboard/admins')) {
      this.activeSection = 'admins';
    } else if (currentUrl.includes('/dashboard/reports')) {
      this.activeSection = 'reports';
    } else if (currentUrl.includes('/dashboard/borrowing')) {
      this.activeSection = 'borrowing';
    } else if (currentUrl.includes('/dashboard/reservations')) {
      this.activeSection = 'reservations';
    } else if (currentUrl.includes('/dashboard/faculty')) {
      this.activeSection = 'faculty';
    } else if (currentUrl.includes('/dashboard/system-settings')) {
      this.activeSection = 'system-settings';
    } else if (currentUrl.includes('/dashboard/logs')) {
      this.activeSection = 'logs';
    } else if (currentUrl.includes('/dashboard/profile')) {
      this.activeSection = 'profile';
    } else {
      this.activeSection = 'overview';
    }
    
    console.log('Sidebar hidden:', this.isSidebarHidden);
    console.log('Active section:', this.activeSection);
  }

  ngOnDestroy(): void {
    this.weatherSubscription?.unsubscribe();
    this.statsSubscription?.unsubscribe();
    this.quoteSubscription?.unsubscribe();
  }

  private loadWeatherData(): void {
    // Call backend weather API instead of OpenWeatherMap directly
    const backendUrl = 'http://localhost:3000/api/v1/weather';

    this.http.get<WeatherResponse>(backendUrl).subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data;
          this.temperature = `${data.temperature}°C`;
          this.location = data.location;
          this.updateWeatherIcon(data.condition);

          // Log weather update
          this.weatherLogger.logWeatherUpdate(this.temperature, this.location);

          // Update DOM elements (both desktop and mobile)
          setTimeout(() => {
            const tempElement = document.getElementById('temperature');
            const locationElement = document.getElementById('location');
            const tempElementMobile = document.getElementById('temperature-mobile');
            const locationElementMobile = document.getElementById('location-mobile');

            if (tempElement) tempElement.textContent = this.temperature;
            if (locationElement) locationElement.textContent = this.location;
            if (tempElementMobile) tempElementMobile.textContent = this.temperature;
            if (locationElementMobile) locationElementMobile.textContent = this.location;
          }, 100);

          // Log if using fallback data
          if (data.fallback) {
            this.weatherLogger.warning('Backend returned fallback weather data');
          } else {
            this.weatherLogger.success('Real weather data received from backend');
          }
        } else {
          throw new Error('Backend weather API returned error');
        }
      },
      error: (error) => {
        this.weatherLogger.error(`Backend weather API error: ${error.message}`);
        if (error.status === 0) {
          this.weatherLogger.logBackendNotRunning();
        }
        // Fallback to simulated data if backend fails
        this.simulateWeatherData();
      }
    });
  }

  private simulateWeatherData(): void {
    const temps = [29, 30, 31, 32, 33];
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    this.temperature = `${randomTemp}°C`;
    this.location = 'Cebu City';

    // Log fallback usage
    this.weatherLogger.warning('Using simulated weather data as fallback');
    this.weatherLogger.logWeatherUpdate(this.temperature, this.location + ' (simulated)');

    // Update DOM elements (both desktop and mobile)
    setTimeout(() => {
      const tempElement = document.getElementById('temperature');
      const locationElement = document.getElementById('location');
      const tempElementMobile = document.getElementById('temperature-mobile');
      const locationElementMobile = document.getElementById('location-mobile');

      if (tempElement) tempElement.textContent = this.temperature;
      if (locationElement) locationElement.textContent = this.location;
      if (tempElementMobile) tempElementMobile.textContent = this.temperature;
      if (locationElementMobile) locationElementMobile.textContent = this.location;
    }, 100);
  }

  private updateWeatherIcon(condition: string): void {
    const iconElement = document.getElementById('weather-icon');
    if (!iconElement) return;

    let iconPath = '';
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        // Sun icon
        iconPath = 'M12 17q2.075 0 3.538-1.462Q17 14.075 17 12t-1.462-3.538Q14.075 7 12 7t-3.538 1.462Q7 9.925 7 12t1.462 3.538Q9.925 17 12 17Zm0 3q-.425 0-.712-.288Q11 19.425 11 19v-1q0-.425.288-.713Q11.575 17 12 17t.713.287Q13 17.575 13 18v1q0 .425-.287.712Q12.425 20 12 20Zm0-16q-.425 0-.712-.288Q11 3.425 11 3V2q0-.425.288-.713Q11.575 1 12 1t.713.287Q13 1.575 13 2v1q0 .425-.287.712Q12.425 4 12 4ZM5.6 6.6l-.7-.7q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l.7.7q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275Zm12.8 0q-.275-.275-.275-.7t.275-.7l.7-.7q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-.7.7q-.275.275-.7.275t-.7-.275ZM19 13q-.425 0-.712-.288Q18 12.425 18 12t.288-.713Q18.575 11 19 11h1q.425 0 .712.287Q21 11.575 21 12t-.288.712Q20.425 13 20 13Zm-15 0q-.425 0-.712-.288Q3 12.425 3 12t.288-.713Q3.575 11 4 11h1q.425 0 .712.287Q6 11.575 6 12t-.288.712Q5.425 13 5 13Zm2.6 6.4q-.275-.275-.275-.7t.275-.7l.7-.7q.275-.275.7-.275t.7.275q.275.275.275.7t-.275.7l-.7.7q-.275.275-.7.275t-.7-.275Zm12.8 0l-.7-.7q-.275-.275-.275-.7t.275-.7q.275-.275.7-.275t.7.275l.7.7q.275.275.275.7t-.275.7q-.275.275-.7.275t-.7-.275Z';
        break;
      case 'clouds':
      case 'cloudy':
      case 'overcast':
      default:
        // Cloud icon (DEFAULT)
        iconPath = 'M6.5 20Q4.22 20 2.61 18.43Q1 16.85 1 14.58Q1 12.63 2.17 11.1Q3.35 9.57 5.25 9.15Q5.88 6.85 7.75 5.43Q9.63 4 12 4Q14.93 4 16.96 6.04Q19 8.07 19 11Q20.73 11.2 21.86 12.5Q23 13.78 23 15.5Q23 17.38 21.69 18.69Q20.38 20 18.5 20H6.5Z';
        break;
      case 'rain':
      case 'rainy':
      case 'drizzle':
        // Rain cloud icon
        iconPath = 'M6.5 20Q4.22 20 2.61 18.43Q1 16.85 1 14.58Q1 12.63 2.17 11.1Q3.35 9.57 5.25 9.15Q5.88 6.85 7.75 5.43Q9.63 4 12 4Q14.93 4 16.96 6.04Q19 8.07 19 11Q20.73 11.2 21.86 12.5Q23 13.78 23 15.5Q23 17.38 21.69 18.69Q20.38 20 18.5 20H6.5ZM9.5 22l-1-2h1l1 2h-1Zm4 0l-1-2h1l1 2h-1Zm4 0l-1-2h1l1 2h-1Z';
        break;
      case 'thunderstorm':
      case 'storm':
        // Storm cloud icon  
        iconPath = 'M6.5 20Q4.22 20 2.61 18.43Q1 16.85 1 14.58Q1 12.63 2.17 11.1Q3.35 9.57 5.25 9.15Q5.88 6.85 7.75 5.43Q9.63 4 12 4Q14.93 4 16.96 6.04Q19 8.07 19 11Q20.73 11.2 21.86 12.5Q23 13.78 23 15.5Q23 17.38 21.69 18.69Q20.38 20 18.5 20H6.5ZM14.5 22l-2.5-4h2l-1-3h1.5l2.5 4h-2l1 3H14.5Z';
        break;
      case 'snow':
      case 'snowy':
        // Snow cloud icon
        iconPath = 'M6.5 20Q4.22 20 2.61 18.43Q1 16.85 1 14.58Q1 12.63 2.17 11.1Q3.35 9.57 5.25 9.15Q5.88 6.85 7.75 5.43Q9.63 4 12 4Q14.93 4 16.96 6.04Q19 8.07 19 11Q20.73 11.2 21.86 12.5Q23 13.78 23 15.5Q23 17.38 21.69 18.69Q20.38 20 18.5 20H6.5ZM8 22v-1h1v1H8Zm2-1v-1h1v1h-1Zm2 1v-1h1v1h-1Zm2-1v-1h1v1h-1Zm2 1v-1h1v1h-1Z';
        break;
      case 'mist':
      case 'fog':
      case 'haze':
        // Fog/mist icon
        iconPath = 'M6.5 20Q4.22 20 2.61 18.43Q1 16.85 1 14.58Q1 12.63 2.17 11.1Q3.35 9.57 5.25 9.15Q5.88 6.85 7.75 5.43Q9.63 4 12 4Q14.93 4 16.96 6.04Q19 8.07 19 11Q20.73 11.2 21.86 12.5Q23 13.78 23 15.5Q23 17.38 21.69 18.69Q20.38 20 18.5 20H6.5ZM4 22v-1h16v1H4Zm0-2v-1h16v1H4Z';
        break;
    }

    iconElement.innerHTML = `<path fill="currentColor" d="${iconPath}"/>`;
  }

  private startStatsUpdates(): void {
    // Simulate real-time stats updates
    this.updateStats();
  }

  private updateStats(): void {
    // Simulate dynamic stats changes
    const booksVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
    const membersVariation = Math.floor(Math.random() * 6) - 3; // -3 to +3
    const activeVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10

    this.stats.books = Math.max(3400, this.stats.books + booksVariation);
    this.stats.members = Math.max(1200, this.stats.members + membersVariation);
    this.stats.activeToday = Math.max(50, Math.min(150, this.stats.activeToday + activeVariation));

    // Update DOM elements (both desktop and mobile)
    setTimeout(() => {
      const booksElement = document.getElementById('books-count');
      const membersElement = document.getElementById('members-count');
      const activeElement = document.getElementById('active-count');
      const booksElementMobile = document.getElementById('books-count-mobile');
      const membersElementMobile = document.getElementById('members-count-mobile');
      const activeElementMobile = document.getElementById('active-count-mobile');

      if (booksElement) booksElement.textContent = this.stats.books.toLocaleString();
      if (membersElement) membersElement.textContent = this.stats.members.toLocaleString();
      if (activeElement) activeElement.textContent = this.stats.activeToday.toString();
      if (booksElementMobile) booksElementMobile.textContent = this.stats.books.toLocaleString();
      if (membersElementMobile) membersElementMobile.textContent = this.stats.members.toLocaleString();
      if (activeElementMobile) activeElementMobile.textContent = this.stats.activeToday.toString();
    }, 100);
  }

  private animateCounters(): void {
    // Animate the counter numbers on page load
    setTimeout(() => {
      const counters = document.querySelectorAll('#books-count, #members-count, #active-count');

      counters.forEach((counter) => {
        const target = parseInt(counter.textContent || '0');
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
          if (current < target) {
            current += increment;
            counter.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target.toLocaleString();
          }
        };

        updateCounter();
      });
    }, 500);
  }

  // Navigation methods
  onLogout(): void {
    this.showLogoutModal = true;
  }

  // Logout modal methods
  confirmLogout(): void {
    // Clear authentication state
    this.authService.logout();

    // Close modal
    this.showLogoutModal = false;

    // Navigate to admin login
    this.router.navigate(['/adminlogin']).catch(() => {
      // Fallback navigation
      window.location.href = '/adminlogin';
    });
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  onNavigate(section: string): void {
    console.log(`Navigating to ${section}`);

    // Hide sidebar for content pages, show for overview
    this.isSidebarHidden = section !== 'overview';

    // Update active section
    this.activeSection = section;

    this.router.navigate(['/dashboard', section]);
  }

  // Check if a specific section is currently active
  isSectionActive(section: string): boolean {
    return this.activeSection === section;
  }

  // Notification methods
  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;

    if (this.showNotificationDropdown && this.notificationButtonRef) {
      // Calculate position relative to the notification button
      const buttonElement = this.notificationButtonRef.nativeElement;
      const rect = buttonElement.getBoundingClientRect();

      // Position dropdown below and to the right of the button
      this.notificationDropdownPosition = {
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right // Align right edge with button
      };
    }
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  markNotificationAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  approveBorrowRequest(notification: any): void {
    if (notification.actionData) {
      const { studentId, studentName, bookId, bookTitle } = notification.actionData;

      // Create approval notification for student
      this.notificationService.createBorrowApprovalNotification(studentId, bookTitle, bookId);

      // Mark the request notification as read
      this.notificationService.markAsRead(notification.id);

      console.log(`✅ Approved borrow request: ${studentName} for "${bookTitle}"`);
    }
  }

  denyBorrowRequest(notification: any): void {
    if (notification.actionData) {
      const { studentId, studentName, bookId, bookTitle } = notification.actionData;

      // Create denial notification for student
      this.notificationService.createBorrowDenialNotification(studentId, bookTitle, bookId, 'Request denied by librarian');

      // Mark the request notification as read
      this.notificationService.markAsRead(notification.id);

      console.log(`❌ Denied borrow request: ${studentName} for "${bookTitle}"`);
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(timestamp).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  showNotification(notification: any): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    // You can add more logic here to show notification details
    console.log('Notification clicked:', notification);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Check if click is on notification button or dropdown
    const isNotificationButton = this.notificationButtonRef &&
      this.notificationButtonRef.nativeElement.contains(target);
    const isNotificationDropdown = target.closest('[data-notification-dropdown]');

    // Close notification dropdown if clicking outside
    if (!isNotificationButton && !isNotificationDropdown && this.showNotificationDropdown) {
      this.showNotificationDropdown = false;
    }
  }

  onProfileClick(): void {
    console.log('Profile clicked');
    this.showProfileModal = !this.showProfileModal;

    if (this.showProfileModal && this.profileButton) {
      this.calculateModalPosition();
    }
  }

  private calculateModalPosition(): void {
    if (this.profileButton && this.profileButton.nativeElement) {
      const buttonRect = this.profileButton.nativeElement.getBoundingClientRect();
      const modalWidth = 192; // 48 * 4 = 192px (w-48 in Tailwind)

      // Position the modal below the button and aligned to its right edge
      this.profileModalTop = `${buttonRect.bottom + 8}px`; // 8px margin below button
      this.profileModalRight = `${window.innerWidth - buttonRect.right}px`; // Align to right edge of button

      console.log('Modal position calculated:', {
        top: this.profileModalTop,
        right: this.profileModalRight,
        buttonRect: buttonRect
      });
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any): void {
    if (this.showProfileModal) {
      this.calculateModalPosition();
    }
  }

  // Profile modal methods
  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  viewProfile(): void {
    this.showProfileModal = false;
    // Navigate to standalone profile page (outside dashboard layout)
    this.router.navigate(['/profile']);
  }

  // Utility methods for template
  getNewsItemClass(color: string): string {
    const baseClasses = 'w-2 h-2 rounded-full mr-3';
    switch (color) {
      case 'red': return `${baseClasses} bg-red-500`;
      case 'green': return `${baseClasses} bg-green-500`;
      case 'blue': return `${baseClasses} bg-blue-500`;
      default: return `${baseClasses} bg-gray-500`;
    }
  }

  // Demo method to add new announcements
  addAnnouncement(text: string): void {
    const newAnnouncement = {
      text: text,
      time: 'Just now',
      icon: 'megaphone'
    };

    this.announcements.unshift(newAnnouncement);

    // Remove old announcements if more than 5
    if (this.announcements.length > 5) {
      this.announcements = this.announcements.slice(0, 5);
    }
  }

  // Demo method to update news
  addNews(text: string, type: string = 'info', color: string = 'blue'): void {
    const newNews = { text, type, color };
    this.latestNews.unshift(newNews);

    // Keep only latest 5 news items
    if (this.latestNews.length > 5) {
      this.latestNews = this.latestNews.slice(0, 5);
    }
  }

  // Dark mode methods
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
    // Navigate to overview for proper theme refresh
    this.router.navigate(['/dashboard/overview']);
  }

  // Mobile menu methods
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // CSS class helpers
  getAsideClasses(): string {
    const baseClasses = 'lg:translate-x-0';
    const darkClasses = this.themeService.getAsideClasses();
    return `${baseClasses} ${darkClasses}`;
  }

  getMainContentClasses(): string {
    return this.themeService.getMainContentClasses();
  }

  getCardClasses(): string {
    return this.themeService.getCardClasses();
  }

  getTextClasses(): string {
    return this.themeService.getTextClasses();
  }

  getSecondaryTextClasses(): string {
    return this.themeService.getSecondaryTextClasses();
  }

  getHeaderClasses(): string {
    return this.themeService.getHeaderClasses();
  }

  // Chat widget methods
  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    this.showTooltip = false;

    if (this.isChatOpen) {
      this.hasUnreadMessages = false;
      this.unreadCount = 0;
      // Scroll to bottom when opening chat
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  sendMessage(): void {
    if (!this.chatInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      text: this.chatInput,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.chatMessages.push(userMessage);
    this.chatInput = '';

    // Scroll to bottom
    setTimeout(() => {
      this.scrollToBottom();
    }, 50);

    // Show typing indicator
    this.isTyping = true;

    // Simulate AI response
    setTimeout(() => {
      this.isTyping = false;
      const aiResponse = this.generateAIResponse(userMessage.text);
      const aiMessage: ChatMessage = {
        text: aiResponse,
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      this.chatMessages.push(aiMessage);

      // Scroll to bottom
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);

      // If chat is closed, show notification
      if (!this.isChatOpen) {
        this.hasUnreadMessages = true;
        this.unreadCount++;
      }
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
  }

  private generateAIResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();

    // Simple keyword-based responses
    if (message.includes('book') || message.includes('find')) {
      const responses = [
        "I can help you find books! What subject or genre are you interested in?",
        "Sure! Are you looking for fiction, non-fiction, or academic books?",
        "I'd be happy to help you find books. Could you tell me more about what you're looking for?",
        "Great! What type of books are you searching for? I can check our catalog for you."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (message.includes('science') || message.includes('computer') || message.includes('programming')) {
      return "Excellent choice! We have a great collection of science and technology books. I can show you books on programming, computer science, physics, chemistry, and more. Which specific area interests you?";
    }

    if (message.includes('fiction') || message.includes('novel') || message.includes('story')) {
      return "Our fiction section is amazing! We have classic literature, contemporary novels, mystery, romance, sci-fi, and fantasy. What genre would you like to explore?";
    }

    if (message.includes('available') || message.includes('check')) {
      return "I can check book availability for you! Please provide the title or author name, and I'll see if it's currently available for borrowing.";
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! Welcome to the Benedicto College Library. I'm BC-AI, your virtual library assistant. How can I help you find books today?";
    }

    if (message.includes('thank') || message.includes('thanks')) {
      return "You're very welcome! I'm always here to help you find the perfect books. Is there anything else you'd like to know about our library?";
    }

    if (message.includes('help')) {
      return "I'm here to help! I can assist you with finding books, checking availability, getting information about library services, and answering questions about our collection. What would you like to know?";
    }

    // Default responses
    const defaultResponses = [
      "That's interesting! Could you tell me more about what you're looking for?",
      "I'd be happy to help you with that. Can you provide more details?",
      "Let me help you find what you need. Could you be more specific about your request?",
      "I'm here to assist you with library resources. What specific information do you need?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private scrollToBottom(): void {
    try {
      if (this.chatMessagesRef) {
        const element = this.chatMessagesRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  onAvatarError(event: any): void {
    this.avatarError = true;
    // Hide the broken image
    event.target.style.display = 'none';
  }

  // Greeting and user info methods
  getGreeting(): string {
    const currentAdmin = this.authService.getCurrentAdmin();
    const firstName = currentAdmin?.fullName?.split(' ')[0] || 'Admin';

    const hour = new Date().getHours();
    let timeGreeting = '';

    if (hour < 12) {
      timeGreeting = 'Good Morning';
    } else if (hour < 17) {
      timeGreeting = 'Good Afternoon';
    } else {
      timeGreeting = 'Good Evening';
    }

    return `${timeGreeting}, ${firstName}!`;
  }

  getMobileGreeting(): string {
    const currentAdmin = this.authService.getCurrentAdmin();
    const firstName = currentAdmin?.fullName?.split(' ')[0] || 'Admin';

    const hour = new Date().getHours();
    let timeGreeting = '';

    if (hour < 12) {
      timeGreeting = 'Morning';
    } else if (hour < 17) {
      timeGreeting = 'Afternoon';
    } else {
      timeGreeting = 'Evening';
    }

    return `Good ${timeGreeting}, ${firstName}!`;
  }

  getCurrentAdmin() {
    return this.authService.getCurrentAdmin();
  }

  loadUserProfileData(): void {
    console.log('🚀 Dashboard: Loading fresh user profile data...');

    // First, get basic info from cached admin data for immediate display
    const currentAdmin = this.authService.getCurrentAdmin();
    if (currentAdmin) {
      const firstName = currentAdmin.fullName?.split(' ')[0] || 'Admin';
      this.currentUserInitial = firstName.charAt(0).toUpperCase();

      console.log('👤 Dashboard: Basic admin info loaded from cache:', {
        fullName: currentAdmin.fullName,
        initial: this.currentUserInitial
      });
    }

    // Then fetch fresh profile data from backend to get latest profile photo
    this.authService.getProfileDetails().subscribe({
      next: (admin) => {
        if (admin) {
          console.log('✅ Dashboard: Fresh profile data received:', admin);

          // Update profile photo with fresh data
          this.currentUserProfilePhoto = admin.profilePhoto || '';

          // Update user initial in case name changed
          const firstName = admin.fullName?.split(' ')[0] || 'Admin';
          this.currentUserInitial = firstName.charAt(0).toUpperCase();

          console.log('📸 Dashboard: Profile photo updated:', {
            profilePhoto: this.currentUserProfilePhoto,
            initial: this.currentUserInitial,
            fullName: admin.fullName
          });
        }
      },
      error: (error) => {
        console.error('❌ Dashboard: Error loading fresh profile data:', error);
        // Fallback to cached data if fresh fetch fails
        if (currentAdmin) {
          this.currentUserProfilePhoto = currentAdmin.profilePhoto || '';
        }
      }
    });

    // Subscribe to admin updates to refresh profile data when changed
    this.authService.currentAdmin$.subscribe(admin => {
      if (admin) {
        this.currentUserProfilePhoto = admin.profilePhoto || '';
        const firstName = admin.fullName?.split(' ')[0] || 'Admin';
        this.currentUserInitial = firstName.charAt(0).toUpperCase();

        console.log('🔄 Dashboard: Admin profile updated via observable:', {
          profilePhoto: this.currentUserProfilePhoto,
          initial: this.currentUserInitial,
          fullName: admin.fullName
        });
      }
    });
  }

  hasValidProfilePhoto(): boolean {
    return !!(this.currentUserProfilePhoto &&
              this.currentUserProfilePhoto.trim() !== '' &&
              !this.currentUserProfilePhoto.startsWith('data:image/svg+xml'));
  }

  getProfileImageSrc(): string {
    console.log('🖼️ Dashboard getProfileImageSrc called:', {
      currentUserProfilePhoto: this.currentUserProfilePhoto,
      hasValidPhoto: this.hasValidProfilePhoto()
    });

    // Return uploaded photo if available and valid, otherwise return default SVG
    if (this.hasValidProfilePhoto()) {
      let imageUrl = this.currentUserProfilePhoto;

      // Convert relative URLs to full backend URLs
      if (imageUrl.startsWith('/api/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
      }

      console.log('🖼️ Dashboard returning uploaded photo:', imageUrl);
      return imageUrl;
    }

    // Generate default SVG with user's initial
    const defaultSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%233B82F6'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3E${this.currentUserInitial}%3C/text%3E%3C/svg%3E`;
    console.log('🖼️ Dashboard returning default SVG for initial:', this.currentUserInitial);
    return defaultSvg;
  }

  onImageError(event: any): void {
    console.warn('Profile image failed to load, falling back to default');
    // Reset to empty to trigger default SVG generation
    this.currentUserProfilePhoto = '';
    event.target.src = this.getProfileImageSrc();
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getMobileDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('Super Admin');
  }

  // Navigation collapse toggle methods
  toggleLibraryManagement(): void {
    this.isLibraryManagementCollapsed = !this.isLibraryManagementCollapsed;
  }

  toggleUserManagement(): void {
    this.isUserManagementCollapsed = !this.isUserManagementCollapsed;
  }

  toggleSystemAdmin(): void {
    this.isSystemAdminCollapsed = !this.isSystemAdminCollapsed;
  }

  toggleReports(): void {
    this.isReportsCollapsed = !this.isReportsCollapsed;
  }

  // Quote of the Day methods
  private loadQuoteOfTheDay(): void {
    console.log('🎯 === LOADING QUOTE OF THE DAY ===');
    this.isQuoteLoading = true;
    this.quoteError = null;

    const userRole = this.quoteService.detectUserRole();
    console.log('🎯 Loading quote for detected role:', userRole);
    console.log('🔍 Available categories for role:', this.quoteService.getCategoriesForRole(userRole));

    // Let the QuoteService handle caching - it will return cached quote if available
    this.quoteSubscription = this.quoteService.getQuoteOfTheDay(userRole).subscribe({
      next: (response) => {
        console.log('🔍 Quote service response:', response);
        if (response.success && response.quote) {
          this.currentQuote = response.quote;
          this.quoteError = null;
          console.log('✅ Quote loaded successfully:', this.currentQuote);
          console.log('👤 Author:', this.currentQuote.author);
          console.log('📝 Text:', this.currentQuote.text);
          console.log('🏷️ Category:', this.currentQuote.category);
        } else {
          this.quoteError = response.message || 'Failed to load quote';
          console.log('❌ Quote loading failed:', this.quoteError);
        }
        this.isQuoteLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading quote:', error);
        this.quoteError = 'Failed to load quote of the day';
        this.isQuoteLoading = false;
      }
    });
  }

  refreshQuote(): void {
    console.log('🔄 Refreshing quote of the day...');
    this.isQuoteLoading = true;
    this.quoteError = null;

    const userRole = this.quoteService.detectUserRole();
    console.log('🎯 Refreshing quote for role:', userRole);
    
    this.quoteSubscription?.unsubscribe();
    this.quoteSubscription = this.quoteService.refreshQuote(userRole).subscribe({
      next: (response) => {
        console.log('🔍 Refresh response:', response);
        if (response.success && response.quote) {
          this.currentQuote = response.quote;
          this.quoteError = null;
          console.log('✅ Quote refreshed successfully:', this.currentQuote);
        } else {
          this.quoteError = response.message || 'Failed to refresh quote';
          console.log('❌ Quote refresh failed:', this.quoteError);
        }
        this.isQuoteLoading = false;
      },
      error: (error) => {
        console.error('❌ Error refreshing quote:', error);
        this.quoteError = 'Failed to refresh quote';
        this.isQuoteLoading = false;
      }
    });
  }

  // Force immediate quote update for testing
  forceQuoteUpdate(): void {
    console.log('🚀 FORCING QUOTE UPDATE FROM DASHBOARD');
    this.isQuoteLoading = true;
    this.quoteError = null;

    const userRole = this.quoteService.detectUserRole();
    console.log('🎯 Detected role for force update:', userRole);

    this.quoteSubscription?.unsubscribe();
    this.quoteSubscription = this.quoteService.forceImmediateUpdate(userRole).subscribe({
      next: (response) => {
        console.log('✅ Force update response:', response);
        if (response.success && response.quote) {
          this.currentQuote = response.quote;
          this.quoteError = null;
          console.log('✅ Quote force updated successfully:', this.currentQuote);
        } else {
          this.quoteError = response.message || 'Failed to force update quote';
          console.log('❌ Quote force update failed:', this.quoteError);
        }
        this.isQuoteLoading = false;
      },
      error: (error) => {
        console.error('❌ Error in force update:', error);
        this.quoteError = 'Failed to force update quote';
        this.isQuoteLoading = false;
      }
    });
  }

  // Test API directly
  testApiDirectly(): void {
    console.log('🧪 TESTING API DIRECTLY FROM DASHBOARD');
    this.quoteService.testApiDirectly().subscribe({
      next: (response) => {
        console.log('🔍 Direct API test result:', response);
        if (response && response.quote) {
          console.log('✅ API is working! Quote:', response.quote);
          console.log('👤 Author:', response.author);
          console.log('🏷️ Category:', response.category);
        }
      },
      error: (error) => {
        console.error('❌ Direct API test error:', error);
      }
    });
  }

  // Clear cache and reload quote
  clearCacheAndReload(): void {
    console.log('🗑️ CLEARING CACHE AND RELOADING QUOTE');
    localStorage.removeItem('quote_of_the_day');
    localStorage.removeItem('quote_last_fetch');
    this.currentQuote = null;
    this.loadQuoteOfTheDay();
  }

  // Test all categories
  testAllCategories(): void {
    console.log('🧪 TESTING ALL CATEGORIES');
    const categories = ['random', 'teachers', 'students', 'motivation', 'inspiration', 'education'];
    
    categories.forEach(category => {
      this.quoteService.testCategory(category).subscribe({
        next: (response) => {
          console.log(`✅ Category "${category}" works:`, response);
        },
        error: (error) => {
          console.error(`❌ Category "${category}" failed:`, error);
        }
      });
    });
  }

  // Random Fact method
  private loadRandomFact(): void {
    this.http.get<any>('https://uselessfacts.jsph.pl/api/v2/facts/random').subscribe({
      next: (data) => {
        this.currentFact = data.text;
      },
      error: (error) => {
        this.factError = 'Failed to load a fact. Please try again later.';
        this.currentFact = 'Could not fetch a fact at this time.';
        console.error('Error fetching random fact:', error);
      }
    });
  }

  // Initialize notifications for admin
  private initializeNotifications(): void {
    // Add some test notifications for admin
    this.addTestAdminNotifications();

    // Subscribe to notifications for admin
    this.notificationService.getNotificationsForRecipient('admin', 'admin')
      .subscribe(notifications => {
        this.notifications = notifications;
        this.adminNotifications = notifications;
        this.unreadNotificationCount = notifications.filter(n => !n.isRead).length;
      });
  }

  // Add test notifications for admin demonstration
  private addTestAdminNotifications(): void {
    // Check if test notifications already exist
    this.notificationService.getNotifications().subscribe(notifications => {
      const hasTestNotifications = notifications.some(n => n.message.includes('admin test notification'));

      if (!hasTestNotifications) {
        // Add sample admin notifications
        this.notificationService.addNotification({
          type: 'borrow_request',
          title: 'New Borrow Request',
          message: 'Student John Doe has requested to borrow "Advanced JavaScript Concepts" - admin test notification',
          recipientType: 'admin',
          recipientId: 'admin',
          relatedBookTitle: 'Advanced JavaScript Concepts',
          actionRequired: true
        });

        this.notificationService.addNotification({
          type: 'overdue_reminder',
          title: 'Overdue Book Alert',
          message: 'Book "React Development Guide" is 3 days overdue by student Jane Smith - admin test notification',
          recipientType: 'admin',
          recipientId: 'admin',
          relatedBookTitle: 'React Development Guide',
          actionRequired: true
        });

        this.notificationService.addNotification({
          type: 'book_returned',
          title: 'System Maintenance',
          message: 'Scheduled system maintenance will occur tonight at 2 AM - admin test notification',
          recipientType: 'admin',
          recipientId: 'admin',
          actionRequired: false
        });
      }
    });
  }
}
