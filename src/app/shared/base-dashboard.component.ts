import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  template: ''
})
export abstract class BaseDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer') chatMessagesRef!: ElementRef;

  // Dark mode and mobile menu state
  isDarkMode: boolean = false;
  isMobileMenuOpen: boolean = false;

  // Logout modal state
  showLogoutModal: boolean = false;

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

  // Chat messages
  chatMessages: Array<{
    id: number;
    text: string;
    isUser: boolean;
    timestamp: Date;
    isTyping?: boolean;
  }> = [
    {
      id: 1,
      text: "Hello! I'm BC-AI, your library assistant. How can I help you find books or resources today?",
      isUser: false,
      timestamp: new Date()
    }
  ];

  constructor(
    protected router: Router,
    protected authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
  }

  ngOnDestroy(): void {
    // Override in child components to clean up subscriptions
  }

  protected abstract initializeDashboard(): void;
  protected abstract getLogoutRedirectRoute(): string;

  // Dark mode methods
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  private loadDarkModePreference(): void {
    const savedMode = localStorage.getItem('darkMode');
    this.isDarkMode = savedMode === 'true';
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
    const baseClasses = this.isDarkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200';
    
    const mobileClasses = 'lg:translate-x-0 fixed lg:relative z-40 lg:z-auto';
    const hiddenClasses = this.isMobileMenuOpen ? '' : '-translate-x-full lg:translate-x-0';
    
    return `${baseClasses} ${mobileClasses} ${hiddenClasses}`;
  }

  getNavLinkClasses(): string {
    return this.isDarkMode 
      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100';
  }

  // Logout modal methods
  showLogout(): void {
    this.showLogoutModal = true;
  }

  confirmLogout(): void {
    this.authService.logout();
    this.showLogoutModal = false;
    this.router.navigate([this.getLogoutRedirectRoute()]).catch(() => {
      window.location.href = this.getLogoutRedirectRoute();
    });
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }

  // Chat widget methods
  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    this.hasUnreadMessages = false;
    this.unreadCount = 0;
    
    if (this.isChatOpen) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  sendMessage(): void {
    if (!this.chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: this.chatInput.trim(),
      isUser: true,
      timestamp: new Date()
    };

    this.chatMessages.push(userMessage);
    this.chatInput = '';
    this.scrollToBottom();

    // Simulate AI typing
    this.isTyping = true;
    setTimeout(() => {
      this.simulateAIResponse(userMessage.text);
    }, 1000 + Math.random() * 2000);
  }

  private simulateAIResponse(userMessage: string): void {
    const responses = this.getAIResponses(userMessage);
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const aiMessage = {
      id: Date.now(),
      text: randomResponse,
      isUser: false,
      timestamp: new Date()
    };

    this.chatMessages.push(aiMessage);
    this.isTyping = false;
    this.scrollToBottom();

    if (!this.isChatOpen) {
      this.hasUnreadMessages = true;
      this.unreadCount++;
    }
  }

  protected abstract getAIResponses(userMessage: string): string[];

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessagesRef) {
        const element = this.chatMessagesRef.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  onChatKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Navigation methods (to be implemented by child components)
  abstract onNavigate(section: string): void;
  abstract onNotificationClick(): void;
  abstract onProfileClick(): void;
}
