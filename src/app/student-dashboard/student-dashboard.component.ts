import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { WeatherLoggerService } from '../services/weather-logger.service';
import { StudentAuthService } from '../services/student-auth.service';
import { ThemeService } from '../services/theme.service';
import { AnnouncementService, Announcement, NewsItem } from '../services/announcement.service';
import { BookService, StudentBook } from '../services/book.service';
import { NotificationService, Notification } from '../services/notification.service';


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

interface StudentStats {
  borrowed: number;
  returned: number;
  reservations: number;
  fines: number;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  time: string;
}

// Using StudentBook from BookService instead of local interface

interface Loan {
  id: string;
  bookId: string;
  book: StudentBook;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  renewalCount: number;
  maxRenewals: number;
  status: 'Active' | 'Overdue' | 'Returned';
  fineAmount?: number;
}

interface Reservation {
  id: string;
  bookId: string;
  book: StudentBook;
  reservationDate: Date;
  expiryDate: Date;
  status: 'Active' | 'Ready' | 'Expired' | 'Fulfilled';
  queuePosition?: number;
}

interface Fine {
  id: string;
  loanId?: string;
  type: 'Overdue' | 'Lost Book' | 'Damage' | 'Late Return';
  amount: number;
  description: string;
  dateIssued: Date;
  datePaid?: Date;
  status: 'Pending' | 'Paid' | 'Waived';
}

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterModule, CommonModule, HttpClientModule, FormsModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css'
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') chatMessagesRef!: ElementRef;
  @ViewChild('notificationButton') notificationButtonRef!: ElementRef;

  private weatherSubscription?: Subscription;
  private statsSubscription?: Subscription;

  // Mobile menu state
  isMobileMenuOpen: boolean = false;

  // Logout modal state
  showLogoutModal: boolean = false;

  // Profile modal state
  showProfileModal: boolean = false;
  profileModalTop: string = '70px';
  profileModalRight: string = '20px';





  @ViewChild('profileButton', { static: false }) profileButton!: ElementRef;

  // Profile photo state
  currentUserProfilePhoto: string = '';
  currentUserInitial: string = 'S';
  currentUserFirstName: string = 'Student';

  // Chat widget state
  isChatOpen: boolean = false;
  showTooltip: boolean = false;
  chatInput: string = '';
  isTyping: boolean = false;
  avatarError: boolean = false;
  hasUnreadMessages: boolean = false;
  unreadCount: number = 0;

  // Sidebar visibility state - Always show right sidebar
  isSidebarHidden: boolean = false;

  // Quote of the Day properties
  currentQuote: any = null;
  isQuoteLoading: boolean = false;
  quoteError: string | null = null;

  // Random Fact properties
  randomFact: string = 'Loading fact...';
  factError: string | null = null;

  // Weather data
  temperature: string = '31°C';
  location: string = 'Cebu City';
  weatherIcon: string = 'sunny';

  // Library stats - will be loaded from database
  stats: LibraryStats = {
    books: 0,
    members: 0,
    activeToday: 0
  };

  // Student-specific stats - will be loaded from database
  studentStats: StudentStats = {
    borrowed: 0,
    returned: 0,
    reservations: 0,
    fines: 0
  };

  // Search functionality
  searchQuery: string = '';
  isSearching: boolean = false;

  // View management
  currentView: string = 'dashboard';

  // Data collections
  availableBooks: StudentBook[] = [];
  currentLoans: Loan[] = [];
  reservations: Reservation[] = [];
  borrowingHistory: Loan[] = [];
  fines: Fine[] = [];

  // Loading states
  isLoadingBooks: boolean = false;
  booksError: string | null = null;

  // Pagination and filtering
  currentPage: number = 1;
  itemsPerPage: number = 20; // Increased to show more books per page
  searchFilter: string = '';
  categoryFilter: string = 'all';
  subjectFilter: string = 'all';
  statusFilter: string = 'all';
  availableCategories: string[] = [];
  availableSubjects: string[] = [];

  // Sorting properties
  sortColumn: string = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal states
  showBookDetailsModal: boolean = false;
  showReserveModal: boolean = false;
  showBorrowConfirmModal: boolean = false;
  showNotificationModal: boolean = false;
  selectedBook: StudentBook | null = null;
  reserveDate: string = '';
  reserveEndDate: string = '';

  // Notifications
  notifications: Notification[] = [];
  studentNotifications: Notification[] = [];
  unreadNotificationCount: number = 0;
  selectedNotification: Notification | null = null;
  showNotificationDropdown: boolean = false;
  notificationDropdownPosition = { top: 0, right: 0 };

  // Success message properties
  showSuccessMessage: boolean = false;
  successMessage: string = '';

  // Sidebar visibility control
  get shouldHideSidebar(): boolean {
    // Hide sidebar when not in dashboard view
    return this.currentView !== 'dashboard';
  }

  // News and announcements - now dynamic
  latestNews: NewsItem[] = [];
  announcements: Announcement[] = [];
  private announcementSubscriptions: Subscription[] = [];

  // Chat messages
  chatMessages: ChatMessage[] = [];

  constructor(
    private http: HttpClient,
    private weatherLogger: WeatherLoggerService,
    private studentAuthService: StudentAuthService,
    private router: Router,
    private themeService: ThemeService,
    private announcementService: AnnouncementService,
    private bookService: BookService,
    private notificationService: NotificationService
  ) {}

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  async ngOnInit(): Promise<void> {
    console.log('🎯 Student Dashboard component initialized successfully!');
    console.log('📊 Loading student dashboard data...');

    // Perform startup tests and logging
    await this.weatherLogger.performStartupTests();

    this.loadWeatherData();
    this.startStatsUpdates();
    this.animateCounters();
    this.loadUserProfileData();
    this.initializeStudentData();
    this.loadQuoteOfTheDay();
    this.loadRandomFact();
    this.loadAnnouncements();
    this.initializeNotifications();

    // Update weather every 10 minutes
    this.weatherSubscription = interval(600000).subscribe(() => {
      this.weatherLogger.info('Scheduled weather update triggered');
      this.loadWeatherData();
    });

    // Update stats every 30 seconds
    this.statsSubscription = interval(30000).subscribe(() => {
      this.updateStats();
    });

    // Listen for window focus to refresh profile data when user returns
    window.addEventListener('focus', () => {
      this.refreshProfileData();
    });
  }

  ngOnDestroy(): void {
    this.weatherSubscription?.unsubscribe();
    this.statsSubscription?.unsubscribe();
    this.announcementSubscriptions.forEach(sub => sub.unsubscribe());
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
    // Update DOM elements with the correct SVG paths
    setTimeout(() => {
      this.updateWeatherIconPaths(condition);
    }, 100);
  }

  private updateWeatherIconPaths(condition: string): void {
    const iconElement = document.getElementById('weather-icon');
    const iconElementMobile = document.getElementById('weather-icon-mobile');
    
    if (!iconElement && !iconElementMobile) return;

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

    if (iconElement) {
      iconElement.innerHTML = `<path fill="currentColor" d="${iconPath}"/>`;
    }
    
    if (iconElementMobile) {
      iconElementMobile.innerHTML = `<path fill="currentColor" d="${iconPath}"/>`;
    }
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
    console.log('🚪 Student confirming logout...');

    // Clear authentication state using proper student auth service
    this.studentAuthService.logout();

    // Close modal
    this.showLogoutModal = false;

    // Force navigation to login page
    console.log('🔄 Redirecting to login page...');
    this.router.navigate(['/login']).then(() => {
      console.log('✅ Successfully navigated to login');
    }).catch(() => {
      // Fallback navigation
      console.log('⚠️ Router navigation failed, using window.location');
      window.location.href = '/login';
    });
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  onNavigate(section: string): void {
    console.log(`Student navigating to ${section}`);

    // Keep sidebar always visible - removed dynamic hiding behavior
    // this.isSidebarHidden = section !== 'dashboard';

    this.currentView = section;
    this.currentPage = 1; // Reset pagination when switching views
  }

  // Quick search methods
  onQuickSearch(): void {
    if (!this.searchQuery.trim()) return;

    this.isSearching = true;
    console.log(`Student searching for: ${this.searchQuery}`);

    // Simulate search delay
    setTimeout(() => {
      this.isSearching = false;
      this.onNavigate('borrow');
      this.searchFilter = this.searchQuery;
    }, 1500);
  }

  private performSearch(): void {
    // Mock search implementation - replace with actual API call
    console.log(`Performing search for: ${this.searchQuery}`);
    // Here you would typically call a search service
    // this.bookService.searchBooks(this.searchQuery).subscribe(...)

    // For now, just clear the search query after "search"
    this.searchQuery = '';
  }

  // Quick Links methods
  onQuickLink(action: string): void {
    console.log(`Student quick link: ${action}`);

    switch (action) {
      case 'search':
        console.log('Opening book search...');
        // Navigate to book search page
        break;
      case 'renew':
        console.log('Opening book renewal...');
        // Navigate to loan renewal page
        break;
      case 'pay-fines':
        console.log('Opening fine payment...');
        // Navigate to fine payment page
        break;
      case 'reserve':
        console.log('Opening book reservation...');
        // Navigate to book reservation page
        break;
      case 'study-rooms':
        console.log('Opening study room booking...');
        // Navigate to study room booking page
        break;
      case 'research-help':
        console.log('Opening research help...');
        // Navigate to research assistance page
        break;
      default:
        console.log('Unknown quick link action:', action);
    }
  }

  // Notification methods
  onNotificationClick(): void {
    console.log('Student notifications clicked');
    // Implement notification panel toggle
  }

  onProfileClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    console.log('Student profile clicked - showProfileModal before:', this.showProfileModal);
    this.showProfileModal = !this.showProfileModal;
    if (this.showProfileModal) {
      this.calculateModalPosition();
    }
    console.log('Student profile clicked - showProfileModal after:', this.showProfileModal);
  }

  private calculateModalPosition(): void {
    if (this.profileButton && this.profileButton.nativeElement) {
      const buttonRect = this.profileButton.nativeElement.getBoundingClientRect();
      const modalWidth = 192; // 48 * 4 = 192px (w-48 in Tailwind)

      // Position the modal below the button and aligned to its right edge
      this.profileModalTop = `${buttonRect.bottom + 8}px`; // 8px margin below button
      this.profileModalRight = `${window.innerWidth - buttonRect.right}px`; // Align to right edge of button

      console.log('Student modal position calculated:', {
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
    // Navigate to student profile page
    this.router.navigate(['/student-profile']);
  }

  // Profile photo methods
  loadUserProfileData(): void {
    console.log('🚀 loadUserProfileData() called');
    const currentStudent = this.studentAuthService.getCurrentStudent();
    console.log('🔍 Current student from auth service:', currentStudent);

    if (currentStudent) {
      console.log('✅ Current student exists, calling getDetailedProfile()');
      // Get detailed profile to access profile photo
      this.studentAuthService.getDetailedProfile().subscribe({
        next: (detailedStudent) => {
          console.log('🔍 Detailed student profile received:', detailedStudent);
          console.log('🔍 Raw profilePhoto value:', detailedStudent?.profilePhoto);
          console.log('🔍 ProfilePhoto type:', typeof detailedStudent?.profilePhoto);
          console.log('🔍 ProfilePhoto === null:', detailedStudent?.profilePhoto === null);
          console.log('🔍 ProfilePhoto === undefined:', detailedStudent?.profilePhoto === undefined);
          console.log('🔍 ProfilePhoto === "":', detailedStudent?.profilePhoto === '');

          if (detailedStudent) {
            // Set profile photo if available, otherwise use default
            this.currentUserProfilePhoto = detailedStudent.profilePhoto || '';

            // Set user first name and initial
            const firstName = detailedStudent.firstName || currentStudent.fullName?.split(' ')[0] || 'Student';
            this.currentUserFirstName = firstName;
            this.currentUserInitial = firstName.charAt(0).toUpperCase();

            console.log('👤 Student profile data loaded:', {
              profilePhoto: this.currentUserProfilePhoto,
              profilePhotoExists: !!detailedStudent.profilePhoto,
              profilePhotoValue: detailedStudent.profilePhoto,
              initial: this.currentUserInitial,
              firstName: this.currentUserFirstName,
              fullName: currentStudent.fullName,
              detailedFirstName: detailedStudent.firstName
            });
          }
        },
        error: (error) => {
          console.error('❌ Error loading detailed profile:', error);
          // Fallback to basic student data
          const firstName = currentStudent.fullName?.split(' ')[0] || 'Student';
          this.currentUserFirstName = firstName;
          this.currentUserInitial = firstName.charAt(0).toUpperCase();
          console.log('🔄 Fallback: Using initial from basic student data:', this.currentUserInitial);
        }
      });
    } else {
      console.log('❌ No current student found');
    }
  }

  hasValidProfilePhoto(): boolean {
    const photoUrl = this.currentUserProfilePhoto;
    return Boolean(photoUrl &&
                   photoUrl.trim() !== '' &&
                   !photoUrl.includes('data:image/svg+xml') && // Not the default SVG
                   (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/')));
  }

  getProfileImageSrc(): string {
    // Return uploaded photo if available and valid, otherwise return default SVG
    if (this.hasValidProfilePhoto()) {
      let imageUrl = this.currentUserProfilePhoto;

      // Convert relative URLs to full backend URLs
      if (imageUrl.startsWith('/api/')) {
        imageUrl = `http://localhost:3000${imageUrl}`;
      }

      return imageUrl;
    }

    console.log('🔤 Using default SVG with initial:', this.currentUserInitial);
    // Generate default SVG with user's initial
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%233B82F6'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3E${this.currentUserInitial}%3C/text%3E%3C/svg%3E`;
  }

  onImageError(event: any): void {
    console.warn('Profile image failed to load, falling back to default');

    // Try loading with a different approach if it's a localhost URL
    const originalSrc = event.target.src;
    if (originalSrc.startsWith('http://localhost:3000/')) {
      const relativePath = originalSrc.replace('http://localhost:3000/', '/');
      event.target.src = relativePath;
      return;
    }

    // Reset to empty to trigger default SVG generation
    this.currentUserProfilePhoto = '';
    event.target.src = this.getProfileImageSrc();
  }

  onImageLoad(event: any): void {
    console.log('✅ Profile image loaded successfully:', event.target.src);
  }

  // Method to refresh profile data (can be called when returning from profile page)
  refreshProfileData(): void {
    console.log('🔄 Manually refreshing profile data...');
    this.loadUserProfileData();
  }

  // Method to force refresh profile data (for testing)
  forceRefreshProfile(): void {
    console.log('🔄 Force refreshing profile data...');
    // Clear current data first
    this.currentUserProfilePhoto = '';
    this.currentUserInitial = 'S';
    // Then reload
    this.loadUserProfileData();
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



  // Utility methods for announcements and news
  getTimeAgo(dateString: string | Date): string {
    if (dateString instanceof Date) {
      const now = new Date();
      const diffInMs = now.getTime() - dateString.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return dateString.toLocaleDateString();
    }
    return this.announcementService.getTimeAgo(dateString);
  }

  getFormattedDate(dateString: string): string {
    return this.announcementService.getFormattedDate(dateString);
  }

  getFormattedDateTime(dateString: string): string {
    return this.announcementService.getFormattedDateTime(dateString);
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

  // Track by functions for ngFor performance
  trackByNewsId(index: number, item: NewsItem): number {
    return item.id || index;
  }

  trackByAnnouncementId(index: number, item: Announcement): number {
    return item.id || index;
  }



  // Dark mode methods
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
    // Refresh the page to ensure all components update properly
    window.location.reload();
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
    const darkClasses = this.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    return `${baseClasses} ${darkClasses}`;
  }

  getMainContentClasses(): string {
    return this.isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  }

  getCardClasses(): string {
    return this.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  }

  getTextClasses(): string {
    return this.isDarkMode ? 'text-white' : 'text-gray-900';
  }

  getSecondaryTextClasses(): string {
    return this.isDarkMode ? 'text-gray-300' : 'text-gray-700';
  }

  getHeaderClasses(): string {
    const darkClasses = this.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    return `shadow-sm border-b px-6 py-4 ${darkClasses}`;
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

    // Simple keyword-based responses for students
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

  // Action methods for different views
  borrowBook(bookId: string): void {
    console.log(`Opening borrow confirmation for book: ${bookId}`);

    const book = this.availableBooks.find(b => b.id === bookId);
    if (!book) {
      console.error('Book not found');
      return;
    }

    if (book.availability !== 'Available') {
      console.error('Book is not available for borrowing');
      return;
    }

    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.error('No student logged in');
      return;
    }

    // Show confirmation modal
    this.selectedBook = book;
    this.showBorrowConfirmModal = true;
  }

  // Confirm borrow action
  confirmBorrowBook(): void {
    if (!this.selectedBook) {
      console.error('No book selected');
      return;
    }

    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.error('No student logged in');
      return;
    }

    const reservationRequest = {
      studentId: currentStudent.studentId,
      bookId: parseInt(this.selectedBook.id),
      status: 'Pending'
    };

    // Close the confirmation modal
    this.showBorrowConfirmModal = false;

    this.http.post('http://localhost:3000/api/v1/borrowing/create-reservation', reservationRequest).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Show success message
          this.showSuccessMessage = true;
          this.successMessage = `Successfully created reservation for "${this.selectedBook!.title}"! Please wait for admin approval.`;

          // Update student stats
          this.updateStudentStats();

          // Create notification for admin
          const currentStudent = this.studentAuthService.getCurrentStudent();
          if (currentStudent) {
            this.notificationService.addNotification({
              type: 'reservation_request',
              title: 'New Book Reservation',
              message: `${currentStudent.fullName} has requested to borrow "${this.selectedBook!.title}"`,
              recipientType: 'admin',
              recipientId: 'admin',
              relatedBookTitle: this.selectedBook!.title,
              relatedStudentId: currentStudent.studentId,
              relatedStudentName: currentStudent.fullName,
              actionRequired: true,
              actionData: {
                studentId: currentStudent.studentId,
                studentName: currentStudent.fullName,
                bookId: this.selectedBook!.id,
                bookTitle: this.selectedBook!.title
              }
            });
          }

          console.log('✅ Book reservation created successfully!');
        }
      },
      error: (error) => {
        console.error('❌ Error creating reservation:', error);
        this.showSuccessMessage = true;
        this.successMessage = 'Failed to create reservation. Please try again.';
      }
    });
  }

  // Cancel borrow confirmation
  cancelBorrowBook(): void {
    this.showBorrowConfirmModal = false;
    this.selectedBook = null;
  }

  renewLoan(loanId: string): void {
    console.log(`Renewing loan: ${loanId}`);
    const loan = this.currentLoans.find(l => l.id === loanId);
    if (loan && loan.renewalCount < loan.maxRenewals && loan.status !== 'Overdue') {
      loan.renewalCount++;
      loan.dueDate = new Date(loan.dueDate.getTime() + 2 * 24 * 60 * 60 * 1000); // Add 2 days
      console.log('Loan renewed successfully!');
    }
  }

  reserveBook(bookId: string): void {
    console.log(`Reserving book: ${bookId}`);

    const book = this.availableBooks.find(b => b.id === bookId);
    if (!book) {
      console.error('Book not found');
      return;
    }

    if (book.availability !== 'Checked Out') {
      console.error('Book is not checked out, cannot reserve');
      return;
    }

    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.error('No student logged in');
      return;
    }

    const reservationRequest = {
      studentId: currentStudent.studentId,
      bookId: parseInt(bookId),
      reservationDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    this.bookService.reserveBook(reservationRequest).subscribe({
      next: (response) => {
        if (response.success) {
          const newReservation: Reservation = {
            id: response.reservationId || `R${Date.now()}`,
            bookId: bookId,
            book: book,
            reservationDate: new Date(),
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'Active',
            queuePosition: this.reservations.filter(r => r.bookId === bookId).length + 1
          };

          this.reservations.push(newReservation);
          this.updateStudentStats();
          console.log('✅ Book reserved successfully!');
        }
      },
      error: (error) => {
        console.error('❌ Error reserving book:', error);
      }
    });
  }

  cancelReservation(reservationId: string): void {
    console.log(`Cancelling reservation: ${reservationId}`);
    const index = this.reservations.findIndex(r => r.id === reservationId);
    if (index > -1) {
      this.reservations.splice(index, 1);
      this.updateStudentStats();
      console.log('Reservation cancelled successfully!');
    }
  }

  payFine(fineId: string): void {
    console.log(`Paying fine: ${fineId}`);
    const fine = this.fines.find(f => f.id === fineId);
    if (fine && fine.status === 'Pending') {
      fine.status = 'Paid';
      fine.datePaid = new Date();
      this.updateStudentStats();
      console.log('Fine paid successfully!');
    }
  }

  private updateStudentStats(): void {
    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.warn('⚠️ No current student found for stats update');
      return;
    }

    console.log('📊 Loading real student stats from database for:', currentStudent.studentId);

    // Load real stats from database
    this.bookService.getStudentStats(currentStudent.studentId).subscribe({
      next: (stats) => {
        console.log('✅ Student stats loaded from database:', stats);
        this.studentStats = {
          borrowed: stats.borrowed || 0,
          returned: stats.returned || 0,
          reservations: stats.reservations || 0,
          fines: stats.fines || 0
        };

        // Trigger counter animation after stats are loaded
        setTimeout(() => {
          this.animateCounters();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error loading student stats:', error);
        // Keep default values on error
        this.studentStats = {
          borrowed: 0,
          returned: 0,
          reservations: 0,
          fines: 0
        };
      }
    });
  }

  // Utility methods
  getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Overdue': return 'text-red-600 bg-red-100';
      case 'Ready': return 'text-blue-600 bg-blue-100';
      case 'Expired': return 'text-gray-600 bg-gray-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Paid': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getAvailabilityClass(availability: string): string {
    switch (availability) {
      case 'Available': return 'text-green-600 bg-green-100';
      case 'Checked Out': return 'text-red-600 bg-red-100';
      case 'Reserved': return 'text-yellow-600 bg-yellow-100';
      case 'Maintenance': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Pagination methods
  get paginatedItems(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    switch (this.currentView) {
      case 'borrow':
        const paginatedBooks = this.filteredBooks.slice(startIndex, endIndex);
        console.log('📄 Paginated books:', paginatedBooks.length, 'from', startIndex, 'to', endIndex);
        return paginatedBooks;
      case 'loans':
        return this.currentLoans.slice(startIndex, endIndex);
      case 'reservations':
        return this.reservations.slice(startIndex, endIndex);
      case 'history':
        return this.borrowingHistory.slice(startIndex, endIndex);
      case 'fines':
        return this.fines.slice(startIndex, endIndex);
      default:
        return [];
    }
  }

  get filteredBooks(): StudentBook[] {
    let filtered = this.availableBooks;
    console.log('🔍 Filtering books - Total available:', this.availableBooks.length);

    if (this.searchFilter) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        book.category.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        book.isbn.includes(this.searchFilter) ||
        (book.subject && book.subject.toLowerCase().includes(this.searchFilter.toLowerCase()))
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(book => book.category === this.categoryFilter);
      console.log('🔍 After category filter:', filtered.length);
    }

    if (this.subjectFilter !== 'all') {
      filtered = filtered.filter(book => book.subject === this.subjectFilter);
      console.log('🔍 After subject filter:', filtered.length);
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(book => book.availability === this.statusFilter);
      console.log('🔍 After status filter:', filtered.length);
    }

    console.log('🔍 Final filtered books:', filtered.length);
    return filtered;
  }

  get totalPages(): number {
    const totalItems = this.currentView === 'borrow' ? this.filteredBooks.length :
                      this.currentView === 'loans' ? this.currentLoans.length :
                      this.currentView === 'reservations' ? this.reservations.length :
                      this.currentView === 'history' ? this.borrowingHistory.length :
                      this.currentView === 'fines' ? this.fines.length : 0;

    return Math.ceil(totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Search and filter methods
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
  }

  // Sorting methods
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    this.availableBooks.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortColumn) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'availability':
          aValue = a.availability.toLowerCase();
          bValue = b.availability.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Pagination methods
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, this.currentPage - halfRange);
    let endPage = Math.min(this.totalPages, this.currentPage + halfRange);

    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxPagesToShow) {
      if (startPage === 1) {
        endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getDisplayRange(): string {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredBooks.length);
    return `${startIndex}-${endIndex} of ${this.filteredBooks.length}`;
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1; // Reset to first page when changing items per page
  }

  // Modal methods
  viewBookDetails(book: StudentBook): void {
    this.selectedBook = book;
    this.showBookDetailsModal = true;
  }

  closeBookDetailsModal(): void {
    this.showBookDetailsModal = false;
    this.selectedBook = null;
  }

  openReserveModal(book: StudentBook): void {
    this.selectedBook = book;
    this.showReserveModal = true;

    // Set default reserve date to today
    const today = new Date();
    this.reserveDate = today.toISOString().split('T')[0];

    // Set default end date to tomorrow (1 day later)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.reserveEndDate = tomorrow.toISOString().split('T')[0];
  }

  closeReserveModal(): void {
    this.showReserveModal = false;
    this.selectedBook = null;
    this.reserveDate = '';
    this.reserveEndDate = '';
  }

  // Get min and max dates for reservation
  getMinReserveDate(): string {
    return new Date().toISOString().split('T')[0]; // Today
  }

  getMaxReserveDate(): string {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3); // 3 days from today
    return maxDate.toISOString().split('T')[0];
  }

  onReserveDateChange(): void {
    if (this.reserveDate) {
      const selectedDate = new Date(this.reserveDate);
      const maxEndDate = new Date(selectedDate);
      maxEndDate.setDate(maxEndDate.getDate() + 3); // Max 3 days from selected date

      // If current end date is beyond the max, reset it
      if (this.reserveEndDate) {
        const currentEndDate = new Date(this.reserveEndDate);
        if (currentEndDate > maxEndDate) {
          this.reserveEndDate = maxEndDate.toISOString().split('T')[0];
        }
      }
    }
  }

  getMinReserveEndDate(): string {
    if (this.reserveDate) {
      const startDate = new Date(this.reserveDate);
      startDate.setDate(startDate.getDate() + 1); // At least 1 day after start date
      return startDate.toISOString().split('T')[0];
    }
    return this.getMinReserveDate();
  }

  getMaxReserveEndDate(): string {
    if (this.reserveDate) {
      const startDate = new Date(this.reserveDate);
      startDate.setDate(startDate.getDate() + 3); // Max 3 days from start date
      return startDate.toISOString().split('T')[0];
    }
    return this.getMaxReserveDate();
  }

  confirmReservation(): void {
    if (!this.selectedBook || !this.reserveDate || !this.reserveEndDate) {
      console.error('Missing reservation details');
      return;
    }

    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.error('No student logged in');
      return;
    }

    const reservationRequest = {
      studentId: currentStudent.studentId,
      bookId: parseInt(this.selectedBook.id),
      reservationDate: this.reserveDate,
      expiryDate: this.reserveEndDate
    };

    this.bookService.reserveBook(reservationRequest).subscribe({
      next: (response) => {
        if (response.success) {
          const newReservation: Reservation = {
            id: response.reservationId || `R${Date.now()}`,
            bookId: this.selectedBook!.id,
            book: this.selectedBook!,
            reservationDate: new Date(this.reserveDate),
            expiryDate: new Date(this.reserveEndDate),
            status: 'Active',
            queuePosition: this.reservations.filter(r => r.bookId === this.selectedBook!.id).length + 1
          };

          this.reservations.push(newReservation);
          this.updateStudentStats();
          this.closeReserveModal();
          console.log('✅ Book reserved successfully!');
        }
      },
      error: (error) => {
        console.error('❌ Error reserving book:', error);
      }
    });
  }

  // Calculation methods for templates
  getTotalOutstandingFines(): number {
    return this.fines.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);
  }

  getTotalPaidFines(): number {
    return this.fines.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  }

  getNavLinkClass(section: string): string {
    const baseClasses = 'nav-link';
    const activeClasses = this.currentView === section ? 'active' : '';
    return `${baseClasses} ${activeClasses}`.trim();
  }

  // Data initialization
  private initializeStudentData(): void {
    this.loadAvailableBooks();
    this.loadCurrentLoans();
    this.loadReservations();
    this.loadBorrowingHistory();
    this.loadFines();
    this.updateStudentStats();
    this.loadCategories();
    this.loadSubjects(); // Load subjects for filtering
    this.loadLibraryStats(); // Load real library statistics
  }

  // Load categories for filtering
  private loadCategories(): void {
    this.bookService.getCategories().subscribe({
      next: (categories) => {
        this.availableCategories = categories;
        console.log('✅ Loaded categories:', categories);
      },
      error: (error) => {
        console.error('❌ Error loading categories:', error);
      }
    });
  }

  // Load subjects for filtering
  private loadSubjects(): void {
    this.bookService.getSubjects().subscribe({
      next: (subjects) => {
        this.availableSubjects = subjects;
        console.log('✅ Loaded subjects:', subjects);
      },
      error: (error) => {
        console.error('❌ Error loading subjects:', error);
      }
    });
  }

  // Load real library statistics from database
  private loadLibraryStats(): void {
    console.log('📊 Loading library statistics...');

    // Update stats based on loaded data
    this.stats.books = this.availableBooks.length;

    // You can add API calls here to get real member count and active users
    // For now, we'll calculate from available data
    this.stats.members = this.currentLoans.length + this.reservations.length + 50; // Approximate
    this.stats.activeToday = Math.floor(this.stats.members * 0.1); // 10% active today

    console.log('✅ Library stats updated:', this.stats);
  }

  loadAvailableBooks(): void {
    this.isLoadingBooks = true;
    this.booksError = null;

    console.log('📚 Loading books from database...');

    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.availableBooks = books;
        this.isLoadingBooks = false;
        console.log(`✅ Loaded ${books.length} books from database`);
        console.log('📖 Sample book data:', books.slice(0, 2)); // Log first 2 books for debugging

        // Apply initial sorting
        this.applySorting();

        // Reset pagination to first page
        this.currentPage = 1;

        // Update current loans and reservations after books are loaded
        this.loadCurrentLoans();
        this.loadReservations();

        // Update library stats with real book count
        this.loadLibraryStats();
      },
      error: (error) => {
        console.error('❌ Error loading books:', error);
        this.booksError = 'Failed to load books from database';
        this.isLoadingBooks = false;

        // Fallback to empty array
        this.availableBooks = [];
      }
    });
  }

  private loadCurrentLoans(): void {
    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.warn('⚠️ No current student found for loading loans');
      this.currentLoans = [];
      return;
    }

    console.log('📚 Loading current loans from database for:', currentStudent.studentId);

    // Load borrowed books (status: Borrowed or Overdue)
    this.bookService.getStudentTransactions(currentStudent.studentId, 'Borrowed').subscribe({
      next: (borrowedTransactions) => {
        console.log('✅ Borrowed transactions loaded:', borrowedTransactions);

        // Also get overdue transactions
        this.bookService.getStudentTransactions(currentStudent.studentId, 'Overdue').subscribe({
          next: (overdueTransactions) => {
            console.log('✅ Overdue transactions loaded:', overdueTransactions);

            // Combine borrowed and overdue transactions
            const allActiveLoans = [...borrowedTransactions, ...overdueTransactions];

            this.currentLoans = allActiveLoans.map(transaction => {
              // Find the book in available books for additional details
              const book = this.availableBooks.find(b => b.id === transaction.BookID.toString());

              return {
                id: `L${transaction.TransactionID}`,
                bookId: transaction.BookID.toString(),
                book: book || {
                  id: transaction.BookID.toString(),
                  title: transaction.BookTitle || 'Unknown Title',
                  author: transaction.BookAuthor || 'Unknown Author',
                  isbn: transaction.ISBN || 'N/A',
                  category: transaction.Category || 'General',
                  subject: '',
                  location: 'Library',
                  availability: 'Checked Out' as const,
                  copies: 1
                },
                borrowDate: new Date(transaction.BorrowDate),
                dueDate: new Date(transaction.DueDate),
                renewalCount: transaction.RenewalCount || 0,
                maxRenewals: 3,
                status: transaction.Status === 'Overdue' ? 'Overdue' : 'Active',
                fineAmount: transaction.Status === 'Overdue' ? this.calculateFine(new Date(transaction.DueDate)) : undefined
              };
            });

            console.log(`✅ Current loans loaded from database: ${this.currentLoans.length} active loans`);
          },
          error: (error) => {
            console.error('❌ Error loading overdue transactions:', error);
            // Just use borrowed transactions if overdue fails
            this.currentLoans = borrowedTransactions.map(transaction => {
              const book = this.availableBooks.find(b => b.id === transaction.BookID.toString());

              return {
                id: `L${transaction.TransactionID}`,
                bookId: transaction.BookID.toString(),
                book: book || {
                  id: transaction.BookID.toString(),
                  title: transaction.BookTitle || 'Unknown Title',
                  author: transaction.BookAuthor || 'Unknown Author',
                  isbn: transaction.ISBN || 'N/A',
                  category: transaction.Category || 'General',
                  subject: '',
                  location: 'Library',
                  availability: 'Checked Out' as const,
                  copies: 1
                },
                borrowDate: new Date(transaction.BorrowDate),
                dueDate: new Date(transaction.DueDate),
                renewalCount: transaction.RenewalCount || 0,
                maxRenewals: 3,
                status: 'Active'
              };
            });
          }
        });
      },
      error: (error) => {
        console.error('❌ Error loading current loans:', error);
        this.currentLoans = [];
      }
    });
  }

  // Helper method to calculate fine amount
  private calculateFine(dueDate: Date): number {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays * 5 : 0; // ₱5 per day
  }

  private loadReservations(): void {
    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.warn('⚠️ No current student found for loading reservations');
      this.reservations = [];
      return;
    }

    console.log('📋 Loading reservations from database for:', currentStudent.studentId);

    this.bookService.getStudentReservations(currentStudent.studentId).subscribe({
      next: (reservations) => {
        console.log('✅ Reservations loaded from database:', reservations);

        this.reservations = reservations.map((reservation, index) => {
          // Find the book in available books for additional details
          const book = this.availableBooks.find(b => b.id === reservation.BookID.toString());

          return {
            id: `R${reservation.ReservationID}`,
            bookId: reservation.BookID.toString(),
            book: book || {
              id: reservation.BookID.toString(),
              title: reservation.BookTitle || 'Unknown Title',
              author: reservation.BookAuthor || 'Unknown Author',
              isbn: reservation.ISBN || 'N/A',
              category: reservation.Category || 'General',
              subject: '',
              location: 'Library',
              availability: 'Reserved' as const,
              copies: 1
            },
            reservationDate: new Date(reservation.ReservedAt),
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: this.mapReservationStatus(reservation.Status),
            queuePosition: index + 1 // Simple queue position based on order
          };
        });

        console.log(`✅ Reservations loaded from database: ${this.reservations.length} reservations`);
      },
      error: (error) => {
        console.error('❌ Error loading reservations:', error);
        this.reservations = [];
      }
    });
  }

  // Helper method to map database reservation status to frontend status
  private mapReservationStatus(dbStatus: string): 'Active' | 'Ready' | 'Expired' | 'Fulfilled' {
    switch (dbStatus) {
      case 'Pending':
        return 'Active';
      case 'Fulfilled':
        return 'Ready';
      case 'Rejected':
        return 'Expired';
      case 'Expired':
        return 'Expired';
      default:
        return 'Active';
    }
  }

  private loadBorrowingHistory(): void {
    // Mock data - replace with actual API call
    const book1 = this.availableBooks.find(b => b.id === '1')!;
    const book2 = this.availableBooks.find(b => b.id === '2')!;

    this.borrowingHistory = [
      {
        id: 'L004',
        bookId: '1',
        book: book1,
        borrowDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        returnDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
        renewalCount: 0,
        maxRenewals: 3,
        status: 'Returned'
      },
      {
        id: 'L005',
        bookId: '2',
        book: book2,
        borrowDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000),
        returnDate: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
        renewalCount: 1,
        maxRenewals: 3,
        status: 'Returned'
      }
    ];
  }

  private loadFines(): void {
    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (!currentStudent) {
      console.warn('⚠️ No current student found for loading fines');
      this.fines = [];
      return;
    }

    console.log('💰 Loading fines from database for:', currentStudent.studentId);

    this.bookService.getStudentFines(currentStudent.studentId).subscribe({
      next: (fines) => {
        console.log('✅ Fines loaded from database:', fines);

        this.fines = fines.map(fine => ({
          id: `F${fine.FineID}`,
          loanId: fine.TransactionID ? `L${fine.TransactionID}` : undefined,
          type: 'Overdue',
          amount: parseFloat(fine.Amount),
          description: fine.Description || `Fine for "${fine.BookTitle || 'Unknown Book'}"`,
          dateIssued: new Date(fine.CreatedAt),
          datePaid: fine.DatePaid ? new Date(fine.DatePaid) : undefined,
          status: fine.Status === 'Paid' ? 'Paid' : 'Pending'
        }));

        console.log(`✅ Fines loaded from database: ${this.fines.length} fines`);
      },
      error: (error) => {
        console.error('❌ Error loading fines:', error);
        this.fines = [];
      }
    });
  }

  // Date methods
  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Quote of the Day methods
  private loadQuoteOfTheDay(): void {
    console.log('🎯 === LOADING STUDENT QUOTE OF THE DAY ===');
    this.isQuoteLoading = true;
    this.quoteError = null;

    // Fetch quote with student-specific categories
    this.fetchStudentQuote().subscribe({
      next: (response: any) => {
        console.log('🔍 Student quote response:', response);
        if (response && (response.quote || response.text)) {
          this.currentQuote = {
            text: response.quote || response.text || 'No quote available',
            author: response.author || 'Unknown Author'
          };
          this.quoteError = null;
          console.log('✅ Student quote loaded successfully:', this.currentQuote);
        } else {
          this.quoteError = 'Failed to load quote';
          console.log('❌ Student quote loading failed:', this.quoteError);
        }
        this.isQuoteLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading student quote:', error);
        this.quoteError = 'Failed to load quote of the day';
        this.isQuoteLoading = false;
        
        // Fallback quote for students
        this.currentQuote = {
          text: "The only way to do great work is to love what you do.",
          author: "Steve Jobs"
        };
      }
    });
  }

  private fetchStudentQuote() {
    // Student-specific categories: motivation, student, education, inspiration
    const categories = ['motivation', 'student', 'education', 'inspiration'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    const url = `https://benedictocollege-quote-api.netlify.app/.netlify/functions/random?category=${randomCategory}`;
    
    console.log('🌐 Making student quote API request to:', url);
    return this.http.get(url);
  }

  private loadRandomFact(): void {
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

  // Greeting methods
  getGreeting(): string {
    const firstName = this.currentUserFirstName;

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
    const firstName = this.currentUserFirstName;

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

  // Announcement loading methods
  private loadAnnouncements(): void {
    // Load announcements for students
    const announcementSub = this.announcementService.getAnnouncementsByAudience('students').subscribe(announcements => {
      this.announcements = announcements;
    });
    this.announcementSubscriptions.push(announcementSub);

    // Load news items
    const newsSub = this.announcementService.getActiveNews().subscribe(news => {
      this.latestNews = news;
    });
    this.announcementSubscriptions.push(newsSub);
  }

  // Initialize notifications
  private initializeNotifications(): void {
    const currentStudent = this.studentAuthService.getCurrentStudent();
    if (currentStudent) {
      // Add some test notifications for demonstration
      this.addTestNotifications(currentStudent.studentId);

      // Subscribe to notifications for this student
      this.notificationService.getNotificationsForRecipient('student', currentStudent.studentId)
        .subscribe(notifications => {
          this.notifications = notifications;
          this.studentNotifications = notifications;
          this.unreadNotificationCount = notifications.filter(n => !n.isRead).length;
        });
    }
  }

  // Add test notifications for demonstration
  private addTestNotifications(studentId: string): void {
    // Check if test notifications already exist
    this.notificationService.getNotifications().subscribe(notifications => {
      const hasTestNotifications = notifications.some(n => n.message.includes('test notification'));

      if (!hasTestNotifications) {
        // Add sample notifications
        this.notificationService.addNotification({
          type: 'borrow_approved',
          title: 'Borrow Request Approved',
          message: 'Your request to borrow "JavaScript: The Good Parts" has been approved by the librarian',
          recipientType: 'student',
          recipientId: studentId,
          relatedBookTitle: 'JavaScript: The Good Parts',
          actionRequired: false
        });

        this.notificationService.addNotification({
          type: 'overdue_reminder',
          title: 'Book Due Soon',
          message: 'Your book "Angular Development Guide" is due in 2 days',
          recipientType: 'student',
          recipientId: studentId,
          relatedBookTitle: 'Angular Development Guide',
          actionRequired: false
        });
      }
    });
  }

  // Show notification modal
  showNotification(notification: Notification): void {
    this.selectedNotification = notification;
    this.showNotificationModal = true;

    // Mark as read when opened
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  // Close notification modal
  closeNotificationModal(): void {
    this.showNotificationModal = false;
    this.selectedNotification = null;
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId);
  }

  // Mark all notifications as read
  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  markNotificationAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }



  // Toggle notification dropdown
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

  // Get due date for borrow modal
  getBorrowDueDate(): string {
    const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    return dueDate.toLocaleDateString();
  }

}
