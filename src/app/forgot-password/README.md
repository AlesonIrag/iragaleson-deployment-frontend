# Forgot Password Component

## Overview
The Forgot Password component provides a comprehensive password recovery system for all user types (Students, Faculty, and Administrators) in the Benedicto College Library Management System.

## Features

### 🔄 Two-Step Recovery Process
1. **Email Reset** - Quick password reset via email link
2. **Manual Request Form** - Detailed form for librarian assistance

### 🎨 Theme-Aware Design
- **Student Theme**: Orange/Blue color scheme
- **Faculty Theme**: Green color scheme  
- **Admin Theme**: Red color scheme

### 📱 Responsive Design
- Mobile-first approach with sliding sidebar navigation
- Desktop layout with logo and form side-by-side
- Consistent with existing login page designs

## Routes

The component is accessible via parameterized routes:

```
/forgot-password/student   - Student password recovery
/forgot-password/faculty   - Faculty password recovery
/forgot-password/admin     - Administrator password recovery
```

## Usage

### From Login Pages
Each login page now includes a "Forgot your password?" link that routes to the appropriate forgot password page:

- Student Login → `/forgot-password/student`
- Faculty Login → `/forgot-password/faculty`
- Admin Login → `/forgot-password/admin`

### Step 1: Email Reset
Users can enter their email address to receive a password reset link. This is the quickest method for users who have access to their registered email.

### Step 2: Manual Request Form
For users who cannot access their email, they can fill out a detailed form that includes:

**For Students:**
- First Name (required)
- Last Name (required)
- Student ID (required, format: YYYY-NNNNN)
- Course (required, dropdown selection)
- Email Address (required)
- Phone Number (optional)

**For Faculty/Admin:**
- First Name (required)
- Last Name (required)
- Email Address (required)
- Phone Number (optional)

## Form Validation

### Email Step
- Email format validation
- Required field validation
- Real-time error clearing

### Manual Form Step
- All required fields validated
- Student ID format validation (YYYY-NNNNN)
- Email format validation
- Course selection validation for students

## User Experience

### Loading States
- Animated loading spinners during form submission
- Disabled form fields during processing
- Clear visual feedback

### Success States
- Animated success messages with checkmark icons
- Automatic redirection to login page after 3 seconds
- Clear instructions for next steps

### Error Handling
- Inline error messages with red styling
- Real-time validation feedback
- User-friendly error descriptions

## Technical Implementation

### Component Structure
```
forgot-password/
├── forgot-password.component.ts    # Main component logic
├── forgot-password.component.html  # Template with two-step form
├── forgot-password.component.css   # Theme-aware styling
└── README.md                      # This documentation
```

### Key Methods
- `switchToForm()` - Navigate to manual form step
- `switchToEmail()` - Navigate back to email step
- `onEmailSubmit()` - Handle email reset submission
- `onFormSubmit()` - Handle manual form submission
- `getThemeColors()` - Dynamic theme color selection
- `toggleMobileMenu()` - Mobile navigation toggle

### Styling Features
- Dynamic theme colors based on user type
- Responsive breakpoints at 800px
- Smooth animations and transitions
- Accessibility-focused design
- Print-friendly styles

## Integration

### Routes Configuration
The component is integrated into the main app routing with parameterized user type:

```typescript
{ path: 'forgot-password/:type', component: ForgotPasswordComponent }
```

### Login Page Integration
All login pages have been updated to link to the appropriate forgot password route using Angular RouterLink directives.

## Future Enhancements

### Backend Integration
- Email service integration for actual password reset emails
- Database validation for user information
- Secure token generation for password reset links
- Librarian notification system for manual requests

### Additional Features
- Password strength requirements display
- Security questions as alternative verification
- Multi-factor authentication options
- Audit logging for password reset attempts

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes
- Progressive enhancement approach
