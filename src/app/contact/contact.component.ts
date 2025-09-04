import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent {

  constructor(private toastService: ToastService) {}
  // Contact form data
  contactForm = {
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  };

  // Form validation errors
  errors = {
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  };

  onSubmit() {
    // Reset errors
    this.errors = {
      firstName: '',
      lastName: '',
      email: '',
      message: ''
    };

    // Basic validation
    let isValid = true;

    if (!this.contactForm.firstName.trim()) {
      this.errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!this.contactForm.lastName.trim()) {
      this.errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!this.contactForm.email.trim()) {
      this.errors.email = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.contactForm.email)) {
      this.errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.contactForm.message.trim()) {
      this.errors.message = 'Message is required';
      isValid = false;
    }

    if (isValid) {
      // Handle form submission here
      console.log('Form submitted:', this.contactForm);
      this.toastService.success('Thank you for your message!', 'We will get back to you soon.');
      
      // Reset form
      this.contactForm = {
        firstName: '',
        lastName: '',
        email: '',
        message: ''
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
