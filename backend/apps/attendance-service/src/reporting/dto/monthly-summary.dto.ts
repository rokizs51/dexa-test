export class MonthlySummaryDto {
  year: number;
  month: number;
  employeeCode?: string;
}

export class EmployeeMonthlySummary {
  employeeCode: string;
  totalRecords: number;
  presentCount: number;      // approved status
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;     // submitted status
  attendanceRate: number;    // percentage
}

export class MonthlySummaryResponse {
  summary: EmployeeMonthlySummary[];
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  generatedAt: Date;
}
