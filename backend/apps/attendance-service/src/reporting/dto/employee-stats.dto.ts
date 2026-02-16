/**
 * DTOs for Employee Statistics (RPT-02)
 *
 * Per-employee attendance rate calculation for selected month.
 * Attendance rate = (approved + submitted) / total * 100
 */

export class EmployeeStatsDto {
  year: number;
  month: number;
  employeeCode: string;
}

export class EmployeeInfo {
  employeeCode: string;
  fullName: string;
  department: string;
}

export class EmployeeStats {
  totalDays: number;
  totalRecords: number;
  approvedCount: number;
  submittedCount: number;
  rejectedCount: number;
  attendanceRate: number;
}

export class EmployeeStatsResponse {
  employee: EmployeeInfo;
  stats: EmployeeStats;
  period: {
    year: number;
    month: number;
  };
  generatedAt: Date;
}
