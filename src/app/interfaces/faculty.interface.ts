// Faculty-related interfaces for the Library Management System

export interface Faculty {
  FacultyID: string;
  FirstName: string;
  LastName: string;
  MiddleInitial?: string;
  Suffix?: string;
  Email: string;
  PhoneNumber?: string;
  ProfilePhoto?: string;
  Department?: string;
  Position?: string;
  Status: 'Active' | 'Inactive';
  CreatedAt: string;
  UpdatedAt: string;
  fullName?: string; // Computed field from backend
}

export interface FacultyListItem {
  id: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phoneNumber?: string;
  profilePhoto?: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  updatedAt: string;
}

export interface FacultyStats {
  totalFaculty: number;
  activeFaculty: number;
  inactiveFaculty: number;
  departments: number;
  // Department breakdown
  departmentCounts: { [department: string]: number };
  // Position breakdown
  positionCounts: { [position: string]: number };
}

export interface FacultyCreateRequest {
  facultyId: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  suffix?: string;
  email: string;
  phoneNumber?: string;
  password: string;
  department?: string;
  position?: string;
  status?: 'Active' | 'Inactive';
}

export interface FacultyUpdateRequest {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  suffix?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  department?: string;
  position?: string;
  status?: 'Active' | 'Inactive';
  profilePhoto?: string;
}

export interface FacultyPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface FacultyAuditLog {
  LogID: number;
  FacultyID: string;
  FacultyName: string;
  FacultyDepartment: string;
  Action: string;
  AffectedTable: string;
  AffectedID: number;
  Timestamp: string;
}

// Common faculty positions
export const FACULTY_POSITIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Instructor',
  'Lecturer',
  'Department Head',
  'Dean',
  'Research Professor',
  'Visiting Professor',
  'Adjunct Professor'
] as const;

// Common academic departments
export const ACADEMIC_DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Mathematics',
  'English',
  'Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Psychology',
  'History',
  'Political Science',
  'Economics',
  'Business Administration',
  'Accounting',
  'Education',
  'Engineering',
  'Nursing',
  'Medicine',
  'Law',
  'Arts and Letters'
] as const;

export type FacultyPosition = typeof FACULTY_POSITIONS[number];
export type AcademicDepartment = typeof ACADEMIC_DEPARTMENTS[number];
