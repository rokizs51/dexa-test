export type UserRole = 'employee' | 'hr_admin';

// Backend user response (from JWT)
export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  employeeCode?: string;
  fullName?: string;
  department?: string;
  position?: string;
}

// Login response from backend
export interface LoginResponse {
  access_token: string;
  user: AuthUser;  // Backend returns user info with token
}

// Keep existing types for internal use
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;  // Changed from fullName for UI consistency
  role: UserRole;
  employeeCode?: string;
  department?: string;
  position?: string;
  avatar?: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  photoUrl?: string;
  checkOutPhotoUrl?: string;
  totalWorkingHours?: string;
  status: 'submitted' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  isActive?: boolean;
  status?: 'active' | 'inactive';  // Frontend alias
}

export interface CheckInData {
  photo: File | null;
  photoUrl?: string;
  location?: string;
  notes?: string;
}

// Updated API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
