import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AnimatedToggleComponent } from '../../shared/components/animated-toggle.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, AnimatedToggleComponent],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.css']
})
export class SystemSettingsComponent implements OnInit {
  // Toggle states
  twoFactorAuthEnabled = true;
  passwordComplexityEnabled = true;
  allowReservations = true;
  emailNotificationsEnabled = true;
  smsNotificationsEnabled = false;
  overdueNotificationsEnabled = true;
  
  // Editable notification settings
  overduePeriodDays = 3;
  reminderDaysBeforeDue = 2;

  constructor(private themeService: ThemeService) { }

  // Getter for dark mode state from theme service
  get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    // Component initialization
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

  // Toggle event handlers
  onTwoFactorAuthToggle(checked: boolean): void {
    this.twoFactorAuthEnabled = checked;
    // TODO: Implement actual toggle logic
  }

  onPasswordComplexityToggle(checked: boolean): void {
    this.passwordComplexityEnabled = checked;
    // TODO: Implement actual toggle logic
  }

  onAllowReservationsToggle(checked: boolean): void {
    this.allowReservations = checked;
    // TODO: Implement actual toggle logic
  }

  onEmailNotificationsToggle(checked: boolean): void {
    this.emailNotificationsEnabled = checked;
    // TODO: Implement actual toggle logic
  }

  onSmsNotificationsToggle(checked: boolean): void {
    this.smsNotificationsEnabled = checked;
    // TODO: Implement actual toggle logic
  }

  onOverdueNotificationsToggle(checked: boolean): void {
    this.overdueNotificationsEnabled = checked;
    // TODO: Implement actual toggle logic
  }
  
  // Notification settings change handlers
  onOverduePeriodChange(event: any): void {
    this.overduePeriodDays = event.target.value;
    // TODO: Implement actual update logic
  }
  
  onReminderDaysChange(event: any): void {
    this.reminderDaysBeforeDue = event.target.value;
    // TODO: Implement actual update logic
  }
}
