import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor() { }

  // Parse CSV content to array of objects
  parseCsv(csvContent: string, headers: string[]): any[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const result: any[] = [];
    
    // Skip header row if it exists
    const dataLines = lines.slice(1);
    
    for (const line of dataLines) {
      if (line.trim()) {
        const values = this.parseCSVLine(line);
        const obj: any = {};
        
        headers.forEach((header, index) => {
          obj[header] = values[index] ? values[index].trim() : '';
        });
        
        result.push(obj);
      }
    }
    
    return result;
  }

  // Parse a single CSV line handling quotes and commas
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // Generate CSV content from array of objects
  generateCsv(data: any[], headers: string[], filename: string): void {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create header row
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    this.downloadCsv(csvContent, filename);
  }

  // Download CSV file
  private downloadCsv(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Validate student CSV data
  validateStudentData(data: any[]): { valid: any[], invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    // Helper function to generate a secure password
    const generateSecurePassword = (): string => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Ensure at least one character from each set
      let password = '';
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill the rest with random characters
      const allChars = lowercase + uppercase + numbers + symbols;
      for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => 0.5 - Math.random()).join('');
    };

    data.forEach((row, index) => {
      const errors: string[] = [];
      
      // Required fields validation
      if (!row.studentId?.trim() && !row.StudentID?.trim() && !row.studentID?.trim()) errors.push('Student ID is required');
      if (!row.firstName?.trim() && !row.FirstName?.trim()) errors.push('First name is required');
      if (!row.lastName?.trim() && !row.LastName?.trim()) errors.push('Last name is required');
      if (!row.email?.trim() && !row.Email?.trim()) errors.push('Email is required');
      // Password is now optional for security - will be auto-generated if not provided
      if (!row.course?.trim() && !row.Course?.trim()) errors.push('Course is required');
      if (!row.yearLevel?.trim() && !row.YearLevel?.trim()) errors.push('Year level is required');
      
      // Email validation
      const emailValue = row.email || row.Email || '';
      if (emailValue && !this.isValidEmail(emailValue)) {
        errors.push('Invalid email format');
      }
      
      // Student ID format validation (if needed)
      const studentIdValue = row.studentId || row.StudentID || row.studentID || '';
      if (studentIdValue && !this.isValidStudentId(studentIdValue)) {
        errors.push('Invalid student ID format');
      }

      // Year level validation
      const yearLevelValue = row.yearLevel || row.YearLevel || '';
      if (yearLevelValue && (isNaN(yearLevelValue) || yearLevelValue < 1 || yearLevelValue > 4)) {
        errors.push('Year level must be between 1 and 4');
      }

      // Create validated row with proper field mapping
      const validatedRow = {
        studentID: studentIdValue || '', // Map to correct field name
        firstName: row.firstName || row.FirstName || '',
        lastName: row.lastName || row.LastName || '',
        middleInitial: row.middleInitial || row.MiddleInitial || '',
        suffix: row.suffix || row.Suffix || '',
        email: emailValue,
        phoneNumber: row.phoneNumber || row.PhoneNumber || '',
        password: row.password?.trim() || generateSecurePassword(), // Auto-generate if not provided
        course: row.course || row.Course || '',
        yearLevel: parseInt(row.yearLevel || row.YearLevel) || 1, // Convert to number as required by API
        section: row.section || row.Section || '',
        status: row.status || row.Status || 'Active'
      };

      if (errors.length === 0) {
        valid.push(validatedRow);
      } else {
        invalid.push({ ...validatedRow, rowNumber: index + 2, errors });
      }
    });

    return { valid, invalid };
  }

  // Validate faculty CSV data
  validateFacultyData(data: any[]): { valid: any[], invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    // Helper function to generate a secure password
    const generateSecurePassword = (): string => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      // Ensure at least one character from each set
      let password = '';
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill the rest with random characters
      const allChars = lowercase + uppercase + numbers + symbols;
      for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => 0.5 - Math.random()).join('');
    };

    data.forEach((row, index) => {
      const errors: string[] = [];
      
      // Required fields validation
      if (!row.facultyId?.trim() && !row.FacultyID?.trim() && !row.facultyID?.trim()) errors.push('Faculty ID is required');
      if (!row.firstName?.trim() && !row.FirstName?.trim()) errors.push('First name is required');
      if (!row.lastName?.trim() && !row.LastName?.trim()) errors.push('Last name is required');
      if (!row.email?.trim() && !row.Email?.trim()) errors.push('Email is required');
      // Password is now optional for security - will be auto-generated if not provided
      if (!row.department?.trim() && !row.Department?.trim()) errors.push('Department is required');
      if (!row.position?.trim() && !row.Position?.trim()) errors.push('Position is required');
      
      // Email validation
      const emailValue = row.email || row.Email || '';
      if (emailValue && !this.isValidEmail(emailValue)) {
        errors.push('Invalid email format');
      }
      
      // Faculty ID format validation
      const facultyIdValue = row.facultyId || row.FacultyID || row.facultyID || '';
      if (facultyIdValue && !this.isValidFacultyId(facultyIdValue)) {
        errors.push('Invalid faculty ID format (should be YYYY-NNNNN)');
      }

      // Create validated row with proper field mapping
      const validatedRow = {
        facultyID: facultyIdValue || '', // Map to correct field name
        firstName: row.firstName || row.FirstName || '',
        lastName: row.lastName || row.LastName || '',
        middleInitial: row.middleInitial || row.MiddleInitial || '',
        suffix: row.suffix || row.Suffix || '',
        email: emailValue,
        phoneNumber: row.phoneNumber || row.PhoneNumber || '',
        password: row.password?.trim() || generateSecurePassword(), // Auto-generate if not provided
        department: row.department || row.Department || '',
        position: row.position || row.Position || '',
        status: row.status || row.Status || 'Active'
      };

      if (errors.length === 0) {
        valid.push(validatedRow);
      } else {
        invalid.push({ ...validatedRow, rowNumber: index + 2, errors });
      }
    });

    return { valid, invalid };
  }

  // Validate book CSV data
  validateBookData(data: any[]): { valid: any[], invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    data.forEach((row, index) => {
      const errors: string[] = [];

      // Required fields validation - check multiple format variations
      const title = row.Title || row.title;
      const author = row.Author || row.author;
      const isbn = row.ISBN || row.isbn;

      if (!title?.trim()) errors.push('Title is required');
      if (!author?.trim()) errors.push('Author is required');
      if (!isbn?.trim()) errors.push('ISBN is required');

      // ISBN validation (basic)
      if (isbn && !this.isValidISBN(isbn)) {
        errors.push('Invalid ISBN format');
      }

      // Year validation
      const publishedYear = row.PublishedYear || row.publicationYear || row.publishedYear;
      if (publishedYear && (isNaN(publishedYear) || publishedYear < 1000 || publishedYear > 2030)) {
        errors.push('Published year must be between 1000 and 2030');
      }

      // Copyright year validation
      const copyrightYear = row.CopyrightYear || row.copyrightYear;
      if (copyrightYear && (isNaN(copyrightYear) || copyrightYear < 1000 || copyrightYear > 2030)) {
        errors.push('Copyright year must be between 1000 and 2030');
      }

      // Copies validation
      const copies = row.Copies || row.copies || row.quantity;
      if (copies && (isNaN(copies) || copies < 0)) {
        errors.push('Copies must be a non-negative number');
      }

      if (errors.length === 0) {
        valid.push(row);
      } else {
        invalid.push({ ...row, rowNumber: index + 2, errors });
      }
    });

    return { valid, invalid };
  }

  // Validation helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidStudentId(studentId: string): boolean {
    // Adjust this regex based on your student ID format
    const studentIdRegex = /^\d{4}-\d{5}$/;
    return studentIdRegex.test(studentId);
  }

  private isValidFacultyId(facultyId: string): boolean {
    const facultyIdRegex = /^\d{4}-\d{5,6}$/;
    return facultyIdRegex.test(facultyId);
  }

  private isValidISBN(isbn: string): boolean {
    // Basic ISBN validation (10 or 13 digits with optional hyphens)
    const isbnRegex = /^(?:\d{9}[\dX]|\d{13})$|^(?:\d{1,5}-\d{1,7}-\d{1,7}-[\dX]|\d{1,5}-\d{1,7}-\d{1,7}-\d{1,7}-\d)$/;
    return isbnRegex.test(isbn.replace(/-/g, ''));
  }

  // Generate sample CSV templates
  generateStudentTemplate(): void {
    const headers = ['studentId', 'firstName', 'lastName', 'middleInitial', 'suffix', 'email', 'phoneNumber', 'password', 'course', 'yearLevel', 'status'];
    const sampleData = [
      {
        studentId: '2024-12345',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        middleInitial: 'P',
        suffix: '',
        email: 'juan.delacruz@student.edu.ph',
        phoneNumber: '09171234567',
        password: 'StudentPass123',
        course: 'Computer Science',
        yearLevel: '1st Year',
        status: 'Active'
      }
    ];
    
    this.generateCsv(sampleData, headers, 'student_template.csv');
  }

  generateFacultyTemplate(): void {
    const headers = ['facultyId', 'firstName', 'lastName', 'middleInitial', 'suffix', 'email', 'phoneNumber', 'password', 'department', 'position', 'status'];
    const sampleData = [
      {
        facultyId: '2024-10001',
        firstName: 'Dr. Maria',
        lastName: 'Santos',
        middleInitial: 'C',
        suffix: '',
        email: 'maria.santos@faculty.edu.ph',
        phoneNumber: '09171234567',
        password: 'FacultyPass123',
        department: 'Computer Science',
        position: 'Professor',
        status: 'Active'
      }
    ];
    
    this.generateCsv(sampleData, headers, 'faculty_template.csv');
  }

  generateBookTemplate(): void {
    const headers = ['Title', 'Author', 'ISBN', 'Category', 'Subject', 'PublishedYear', 'CopyrightYear', 'Publisher', 'CallNumber', 'DeweyDecimal', 'Copies', 'Remarks', 'Status', 'ShelfLocation', 'AcquisitionDate'];
    const sampleData = [
      {
        Title: 'Introduction to Computer Science',
        Author: 'John Smith',
        ISBN: '978-0123456789',
        Category: 'Computer Science',
        Subject: 'Programming',
        PublishedYear: '2023',
        CopyrightYear: '2023',
        Publisher: 'Tech Publications',
        CallNumber: 'QA76.6 .S65',
        DeweyDecimal: '004.0',
        Copies: '5',
        Remarks: 'A comprehensive guide to computer science fundamentals',
        Status: 'Available',
        ShelfLocation: 'Section A, Shelf 1',
        AcquisitionDate: '2024-01-15'
      }
    ];

    this.generateCsv(sampleData, headers, 'book_template.csv');
  }
}
