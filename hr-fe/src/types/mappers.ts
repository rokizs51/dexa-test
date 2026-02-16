import type { AuthUser, User, Employee, Attendance } from './index';

// Convert backend AuthUser to frontend User
export function toUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.fullName || authUser.email.split('@')[0],
    role: authUser.role,
    employeeCode: authUser.employeeCode,
    department: authUser.department,
    position: authUser.position,
  };
}

// Convert backend employee to frontend format
export function toEmployee(emp: any): Employee {
  return {
    id: emp.id,
    userId: emp.userId,
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    email: emp.email,
    department: emp.department,
    position: emp.position,
    joinDate: emp.joinDate,
    isActive: emp.isActive,
    status: emp.isActive ? 'active' : 'inactive',
  };
}

// Convert backend attendance to frontend format
export function toAttendance(att: any): Attendance {
  return {
    id: att.id,
    employeeId: att.employeeId || 0,
    employeeName: att.employeeName || att.fullName || 'Unknown',
    employeeCode: att.employeeCode,
    department: att.department || 'General',
    date: att.checkInTime?.split('T')[0] || new Date().toISOString().split('T')[0],
    checkInTime: att.checkInTime,
    checkOutTime: att.checkOutTime,
    photoUrl: att.photoUrl,
    checkOutPhotoUrl: att.checkOutPhotoUrl,
    totalWorkingHours: att.totalWorkingHours,
    status: att.status,
    rejectionReason: att.rejectionReason,
    createdAt: att.createdAt,
    updatedAt: att.updatedAt,
  };
}
