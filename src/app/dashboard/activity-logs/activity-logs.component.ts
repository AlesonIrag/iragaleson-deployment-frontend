import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string;
  level: 'Info' | 'Warning' | 'Error' | 'Critical';
}

interface ActivityStats {
  totalLogs: number;
  userActions: number;
  securityEvents: number;
  errorLogs: number;
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-logs.component.html',
  styleUrls: ['./activity-logs.component.css']
})
export class ActivityLogsComponent implements OnInit {

  stats: ActivityStats = {
    totalLogs: 1247,
    userActions: 892,
    securityEvents: 45,
    errorLogs: 12
  };

  activityLogs: ActivityLog[] = [
    {
      id: 'LOG001',
      timestamp: new Date('2024-07-27T14:30:15'),
      user: 'System',
      userRole: 'System',
      action: 'API Status',
      details: '[OpenWeatherAPI/INFO]: Weather service running on port 3001 (status: 200, response_time: 245ms, location: Cebu City)',
      ipAddress: 'api.openweathermap.org',
      level: 'Info'
    },
    {
      id: 'LOG002',
      timestamp: new Date('2024-07-27T14:29:42'),
      user: 'admin_msantos',
      userRole: 'Super Admin',
      action: 'Database Insert',
      details: '[BookManager/INFO]: Added new book record ISBN-978-0134685991 "Effective Java 3rd Edition" by Joshua Bloch to Computer Science collection',
      ipAddress: '192.168.1.100',
      level: 'Info'
    },
    {
      id: 'LOG003',
      timestamp: new Date('2024-07-27T14:28:33'),
      user: 'System',
      userRole: 'System',
      action: 'API Status',
      details: '[QuoteAPI/INFO]: Daily inspirational quote loaded successfully (provider: quotegarden.io, cache_ttl: 86400s)',
      ipAddress: 'quotegarden.io',
      level: 'Info'
    },
    {
      id: 'LOG004',
      timestamp: new Date('2024-07-27T14:27:18'),
      user: 'librarian_jrivera',
      userRole: 'Librarian',
      action: 'Transaction',
      details: '[LoanManager/INFO]: Book checkout processed - ISBN: 978-0321563842, Student: S2024001 (Maria Elena Cruz), Due: 2024-08-10',
      ipAddress: '192.168.1.105',
      level: 'Info'
    },
    {
      id: 'LOG005',
      timestamp: new Date('2024-07-27T14:26:07'),
      user: 'admin_msantos',
      userRole: 'Super Admin',
      action: 'User Management',
      details: '[UserManager/INFO]: Created new student account S2024028 (Diego Antonio Morales, Program: BSCS, Year: 2)',
      ipAddress: '192.168.1.100',
      level: 'Info'
    },
    {
      id: 'LOG006',
      timestamp: new Date('2024-07-27T14:25:44'),
      user: 'System',
      userRole: 'System',
      action: 'Security Event',
      details: '[AuthManager/WARN]: Failed login attempt for user "admin" from IP 203.124.45.67 (attempt 3/5, lockout in 2 attempts)',
      ipAddress: '203.124.45.67',
      level: 'Warning'
    },
    {
      id: 'LOG007',
      timestamp: new Date('2024-07-27T14:24:22'),
      user: 'System',
      userRole: 'System',
      action: 'Database Backup',
      details: '[BackupManager/INFO]: Automated database backup completed successfully (size: 2.3GB, duration: 45s, location: /backups/library_20240727_142422.sql)',
      ipAddress: 'localhost',
      level: 'Info'
    },
    {
      id: 'LOG008',
      timestamp: new Date('2024-07-27T14:23:11'),
      user: 'faculty_afernandez',
      userRole: 'Faculty',
      action: 'Book Request',
      details: '[RequestManager/INFO]: Faculty book acquisition request submitted - Title: "Advanced Algorithms and Data Structures", Estimated cost: ₱2,450.00',
      ipAddress: '192.168.1.110',
      level: 'Info'
    },
    {
      id: 'LOG009',
      timestamp: new Date('2024-07-27T14:22:05'),
      user: 'System',
      userRole: 'System',
      action: 'API Error',
      details: '[WeatherAPI/ERROR]: Connection timeout to api.openweathermap.org (timeout: 5000ms, retry_count: 3/3, fallback: cached_data)',
      ipAddress: 'api.openweathermap.org',
      level: 'Error'
    },
    {
      id: 'LOG010',
      timestamp: new Date('2024-07-27T14:21:38'),
      user: 'student_rtorres',
      userRole: 'Student',
      action: 'Book Return',
      details: '[ReturnManager/WARN]: Late book return processed - ISBN: 978-0134685991, Student: S2024015, Days overdue: 3, Fine: ₱15.00',
      ipAddress: '192.168.1.115',
      level: 'Warning'
    }
  ];

  constructor(private themeService: ThemeService) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    // Component initialization
  }

  getTextClasses(): string {
    return this.isDarkMode ? 'text-white' : 'text-gray-900';
  }

  getSecondaryTextClasses(): string {
    return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
  }

  getCardClasses(): string {
    return this.isDarkMode 
      ? 'bg-gray-800 border-gray-700 text-white' 
      : 'bg-white border-gray-200 text-gray-900';
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'API Status':
        return 'bg-green-100 text-green-800';
      case 'Database Insert':
      case 'Database Backup':
        return 'bg-blue-100 text-blue-800';
      case 'Transaction':
      case 'Book Return':
        return 'bg-purple-100 text-purple-800';
      case 'Security Event':
        return 'bg-yellow-100 text-yellow-800';
      case 'User Management':
      case 'Book Request':
        return 'bg-indigo-100 text-indigo-800';
      case 'API Error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'Info':
        return 'bg-blue-100 text-blue-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  getTimestampClass(): string {
    return this.isDarkMode ? 'text-blue-400' : 'text-blue-600';
  }

  getLogLevelColor(level: string): string {
    switch (level) {
      case 'Info':
        return this.isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'Warning':
        return this.isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'Error':
        return this.isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'Critical':
        return this.isDarkMode ? 'text-red-300' : 'text-red-700';
      default:
        return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  }

  getLogMessageClass(): string {
    return this.isDarkMode ? 'text-gray-300' : 'text-gray-700';
  }
}
