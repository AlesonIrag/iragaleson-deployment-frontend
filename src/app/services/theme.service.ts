import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    // Load initial theme preference
    this.loadThemePreference();
  }

  /**
   * Get current dark mode state
   */
  get isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    const newMode = !this.isDarkModeSubject.value;
    this.setDarkMode(newMode);
  }

  /**
   * Set dark mode state
   */
  setDarkMode(isDark: boolean): void {
    this.isDarkModeSubject.next(isDark);
    this.saveThemePreference(isDark);
    this.updateDocumentTheme(isDark);
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('darkMode');
    const isDark = savedTheme === 'true';
    this.isDarkModeSubject.next(isDark);
    this.updateDocumentTheme(isDark);
  }

  /**
   * Save theme preference to localStorage
   */
  private saveThemePreference(isDark: boolean): void {
    localStorage.setItem('darkMode', isDark.toString());
  }

  /**
   * Update document theme attribute
   */
  private updateDocumentTheme(isDark: boolean): void {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  /**
   * CSS class helpers for components
   */
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
    return this.isDarkMode ? 'text-gray-400' : 'text-gray-600';
  }

  getAsideClasses(): string {
    return this.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  }

  getHeaderClasses(): string {
    const darkClasses = this.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    return `shadow-sm border-b px-6 py-4 ${darkClasses}`;
  }

  // Additional helper methods for common UI patterns
  getInputClasses(): string {
    return this.isDarkMode
      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500';
  }

  getSelectClasses(): string {
    return this.isDarkMode
      ? 'border-gray-600 bg-gray-700 text-white'
      : 'border-gray-300 bg-white text-gray-900';
  }

  getTableHeaderClasses(): string {
    return this.isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  }

  getTableRowHoverClasses(): string {
    return this.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  }

  getBorderClasses(): string {
    return this.isDarkMode ? 'border-gray-700' : 'border-gray-200';
  }
}
