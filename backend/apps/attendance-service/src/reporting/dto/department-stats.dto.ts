/**
 * DTOs for Department Statistics (RPT-03, RPT-04)
 *
 * Department-level compliance statistics with compliance rate calculation.
 * Compliance rate = approved records / total records * 100
 */

export class DepartmentStatsDto {
  year: number;
  month: number;
}

export class DepartmentStats {
  department: string;
  totalEmployees: number;
  totalRecords: number;
  approvedCount: number;
  submittedCount: number;
  rejectedCount: number;
  complianceRate: number;
}

export class DepartmentStatsResponse {
  departments: DepartmentStats[];
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  generatedAt: Date;
}
