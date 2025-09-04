# 🔐 JWT Authentication Implementation Guide

## Overview

This document describes the complete JWT (JSON Web Token) authentication system implemented across all user types in the Benedicto College Library Management System.

## 🎯 Features Implemented

### ✅ Complete JWT Authentication
- **Token Generation** - JWT tokens for all user types (Students, Faculty, Admins)
- **Token Validation** - Backend validation with database verification
- **Token Blacklisting** - Secure logout with token revocation
- **Session Management** - Frontend and backend session handling
- **Route Protection** - JWT middleware for protected endpoints

### 🔒 Security Features
- **Configurable Expiration** - Default 24 hours, customizable via environment
- **Secure Storage** - localStorage with proper token handling
- **Token Verification** - Real-time validation with user status checks
- **Blacklist System** - Prevents reuse of logged-out tokens
- **Error Handling** - Comprehensive error responses and logging

## 🏗️ Architecture

### Backend Implementation

#### JWT Token Structure
```javascript
{
  // Student Token
  studentId: "2024-00001",
  fullName: "John Doe",
  email: "john@benedicto.edu.ph",
  type: "student",
  iat: 1234567890,
  exp: 1234654290
}

{
  // Faculty Token  
  facultyId: 123,
  fullName: "Dr. Jane Smith",
  email: "jane@benedicto.edu.ph",
  department: "Computer Science",
  position: "Professor",
  type: "faculty",
  iat: 1234567890,
  exp: 1234654290
}

{
  // Admin Token
  adminId: 1,
  fullName: "Admin User",
  email: "admin@benedicto.edu.ph", 
  role: "Super Admin",
  type: "admin",
  iat: 1234567890,
  exp: 1234654290
}
```

#### Environment Configuration
```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret-key-here
```

### API Endpoints

#### Student Authentication (`/api/v1/auth`)
- `POST /login` - Student login with JWT token
- `POST /validate-session` - Validate student JWT token
- `POST /logout` - Logout and blacklist token

#### Faculty Authentication (`/api/v1/facultyauth`)
- `POST /login-faculty` - Faculty login with JWT token
- `POST /validate-session` - Validate faculty JWT token
- `POST /logout` - Logout and blacklist token

#### Admin Authentication (`/api/v1/adminauth`)
- `POST /login-admin` - Admin login with JWT token
- `POST /validate-session` - Validate admin JWT token
- `POST /logout` - Logout and blacklist token

### JWT Middleware

#### Generic Authentication
```javascript
const { authenticateJWT } = require('./middleware/jwtAuth');

// Protect any route
app.use('/api/v1/protected', authenticateJWT, protectedRoutes);
```

#### User-Specific Authentication
```javascript
const { authenticateStudent, authenticateFaculty, authenticateAdmin } = require('./middleware/jwtAuth');

// Student-only routes
app.use('/api/v1/student', authenticateStudent, studentRoutes);

// Faculty-only routes  
app.use('/api/v1/faculty', authenticateFaculty, facultyRoutes);

// Admin-only routes
app.use('/api/v1/admin', authenticateAdmin, adminRoutes);
```

#### Role-Based Authorization
```javascript
const { requireRole } = require('./middleware/jwtAuth');

// Super Admin only
app.use('/api/v1/admin/super', authenticateAdmin, requireRole(['Super Admin']), superAdminRoutes);

// Librarian or higher
app.use('/api/v1/admin/library', authenticateAdmin, requireRole(['Librarian', 'Data Center Admin', 'Super Admin']), libraryRoutes);
```

### Frontend Implementation

#### Token Storage
```typescript
// Store JWT token after login
localStorage.setItem('studentToken', response.token);
localStorage.setItem('facultyToken', response.token);
localStorage.setItem('adminToken', response.token);
```

#### Session Validation
```typescript
// Validate session with backend
validateSession(): Observable<boolean> {
  const token = this.getToken();
  return this.apiService.post('/auth/validate-session', { token }).pipe(
    map(response => response.success),
    catchError(() => of(false))
  );
}
```

#### Route Guards
```typescript
// Protect routes with JWT validation
canActivate(): Observable<boolean> {
  return this.authService.validateSession().pipe(
    map(isValid => {
      if (!isValid) {
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    })
  );
}
```

## 🧪 Testing

### Test Files Available
- `test-student-login.html` - Student JWT testing
- `test-faculty-jwt.html` - Faculty JWT testing  
- `test-admin-jwt.html` - Admin JWT testing
- `test-complete-jwt.js` - Comprehensive automated testing

### Running Tests

#### Manual Testing
1. Open test HTML files in browser
2. Enter credentials and test login
3. Test session validation
4. Test logout and token blacklisting

#### Automated Testing
```bash
# Install dependencies
npm install axios

# Run comprehensive tests
node test-complete-jwt.js
```

### Test Credentials
```javascript
// Default test credentials (update as needed)
const TEST_CREDENTIALS = {
  student: {
    studentId: '2024-00001',
    password: 'password123'
  },
  faculty: {
    facultyId: '2022-00001',
    password: 'password123'
  },
  admin: {
    email: 'admin@benedicto.edu.ph',
    password: 'admin123'
  }
};
```

## 🔧 Usage Examples

### Backend Route Protection
```javascript
const express = require('express');
const { authenticateStudent, requireRole } = require('./middleware/jwtAuth');
const router = express.Router();

// Student-only route
router.get('/profile', authenticateStudent, (req, res) => {
  res.json({
    success: true,
    student: req.student,
    message: 'Student profile retrieved'
  });
});

// Admin route with role requirement
router.delete('/users/:id', authenticateAdmin, requireRole(['Super Admin']), (req, res) => {
  // Only Super Admins can delete users
  res.json({ success: true, message: 'User deleted' });
});
```

### Frontend Service Usage
```typescript
// Login and store token
this.authService.login(credentials).subscribe(success => {
  if (success) {
    this.router.navigate(['/dashboard']);
  }
});

// Check authentication status
this.authService.isAuthenticated$.subscribe(isAuth => {
  this.isLoggedIn = isAuth;
});

// Logout and clear tokens
this.authService.logout();
```

## 🚀 Deployment Considerations

### Production Security
1. **Strong JWT Secret** - Use cryptographically secure random string
2. **HTTPS Only** - Never transmit tokens over HTTP
3. **Token Expiration** - Set appropriate expiration times
4. **Refresh Tokens** - Consider implementing refresh token mechanism
5. **Rate Limiting** - Protect authentication endpoints

### Environment Variables
```env
# Production settings
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRES_IN=1h
NODE_ENV=production
```

### Database Considerations
- Consider storing blacklisted tokens in database for persistence
- Implement token cleanup for expired blacklisted tokens
- Add indexes on user lookup fields for performance

## 📋 Next Steps

### Potential Enhancements
1. **Refresh Tokens** - Automatic token renewal
2. **Multi-Device Support** - Track active sessions
3. **Token Analytics** - Login/logout tracking
4. **Advanced Blacklisting** - Database-backed token revocation
5. **Social Login** - OAuth integration

### Monitoring
- Track authentication failures
- Monitor token usage patterns
- Alert on suspicious activity
- Log security events

## 🔍 Troubleshooting

### Common Issues
1. **Token Expired** - Check JWT_EXPIRES_IN setting
2. **Invalid Secret** - Verify JWT_SECRET matches
3. **Blacklist Not Working** - Restart server (in-memory blacklist)
4. **CORS Issues** - Check allowed origins configuration

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will provide verbose JWT validation logs and error details.
