import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DrizzleService, attendance, employees } from '@dexa/database';
import { sql, eq, and, gte, lte, asc, isNotNull } from 'drizzle-orm';
import { MonthlySummaryDto, EmployeeMonthlySummary } from './dto/monthly-summary.dto';
import { EmployeeStatsDto, EmployeeStatsResponse } from './dto/employee-stats.dto';
import { DepartmentStatsDto, DepartmentStats, DepartmentStatsResponse } from './dto/department-stats.dto';

@Injectable()
export class ReportingService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getMonthlySummary(params: MonthlySummaryDto): Promise<{
    summary: EmployeeMonthlySummary[];
    period: { year: number; month: number; monthName: string };
    generatedAt: Date;
  }> {
    const { year, month, employeeCode } = params;

    // Calculate date range for the month (Phase 5 pattern: server-side dates)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Build filter conditions array (Phase 5 pattern)
    const conditions = [
      gte(attendance.checkInTime, startDate),
      lte(attendance.checkInTime, endDate),
    ];

    if (employeeCode) {
      conditions.push(eq(attendance.employeeCode, employeeCode));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Aggregation query with conditional counting using CASE WHEN
    const results = await this.drizzle.db
      .select({
        employeeCode: attendance.employeeCode,
        totalRecords: sql<number>`cast(count(${attendance.id}) as unsigned)`,
        presentCount: sql<number>`cast(sum(case when ${attendance.status} = 'approved' then 1 else 0 end) as unsigned)`,
        pendingCount: sql<number>`cast(sum(case when ${attendance.status} = 'submitted' then 1 else 0 end) as unsigned)`,
        rejectedCount: sql<number>`cast(sum(case when ${attendance.status} = 'rejected' then 1 else 0 end) as unsigned)`,
        // Attendance rate: approved + submitted (pending approval) / total
        attendanceRate: sql<number>`cast(
          coalesce(round(
            (sum(case when ${attendance.status} in ('approved', 'submitted') then 1 else 0 end) /
            nullif(count(${attendance.id}), 0) * 100
          , 2), 0) as decimal(5,2)
        )`,
      })
      .from(attendance)
      .where(whereClause)
      .groupBy(attendance.employeeCode)
      .orderBy(asc(attendance.employeeCode));

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      summary: results,
      period: {
        year,
        month,
        monthName: monthNames[month - 1],
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Per-Employee Attendance Rate (RPT-02)
   * JOINs with employees table to get fullName and department.
   * Attendance rate = (approved + submitted) / total * 100
   */
  async getEmployeeStats(dto: EmployeeStatsDto): Promise<EmployeeStatsResponse> {
    const { year, month, employeeCode } = dto;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get employee info with JOIN (fullName, department)
    const employeeResult = await this.drizzle.db
      .select({
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        department: employees.department,
      })
      .from(employees)
      .where(eq(employees.employeeCode, employeeCode));

    const employeeInfo = employeeResult[0];

    if (!employeeInfo) {
      throw new RpcException({
        statusCode: 404,
        message: 'Employee not found',
      });
    }

    // Get attendance stats for the employee
    const statsResult = await this.drizzle.db
      .select({
        totalDays: sql<number>`cast(count(distinct date(${attendance.checkInTime})) as unsigned)`,
        totalRecords: sql<number>`cast(count(${attendance.id}) as unsigned)`,
        approvedCount: sql<number>`cast(sum(case when ${attendance.status} = 'approved' then 1 else 0 end) as unsigned)`,
        submittedCount: sql<number>`cast(sum(case when ${attendance.status} = 'submitted' then 1 else 0 end) as unsigned)`,
        rejectedCount: sql<number>`cast(sum(case when ${attendance.status} = 'rejected' then 1 else 0 end) as unsigned)`,
        attendanceRate: sql<number>`cast(
          coalesce(round(
            (sum(case when ${attendance.status} in ('approved', 'submitted') then 1 else 0 end) /
            nullif(count(${attendance.id}), 0) * 100
          , 2), 0) as decimal(5,2)
        )`,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeCode, employeeCode),
          gte(attendance.checkInTime, startDate),
          lte(attendance.checkInTime, endDate)
        )
      );

    const stats = statsResult[0] || {
      totalDays: 0,
      totalRecords: 0,
      approvedCount: 0,
      submittedCount: 0,
      rejectedCount: 0,
      attendanceRate: 0,
    };

    return {
      employee: {
        employeeCode: employeeInfo.employeeCode,
        fullName: employeeInfo.fullName,
        department: employeeInfo.department,
      },
      stats,
      period: { year, month },
      generatedAt: new Date(),
    };
  }

  /**
   * Department-Level Compliance Statistics (RPT-03, RPT-04)
   * INNER JOIN attendance + employees, GROUP BY department
   * Compliance rate = approved records / total records * 100
   */
  async getDepartmentStats(dto: DepartmentStatsDto): Promise<DepartmentStatsResponse> {
    const { year, month } = dto;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // INNER JOIN attendance + employees, GROUP BY department
    const results = await this.drizzle.db
      .select({
        department: employees.department,
        totalEmployees: sql<number>`cast(count(distinct ${employees.employeeCode}) as unsigned)`,
        totalRecords: sql<number>`cast(count(${attendance.id}) as unsigned)`,
        approvedCount: sql<number>`cast(sum(case when ${attendance.status} = 'approved' then 1 else 0 end) as unsigned)`,
        submittedCount: sql<number>`cast(sum(case when ${attendance.status} = 'submitted' then 1 else 0 end) as unsigned)`,
        rejectedCount: sql<number>`cast(sum(case when ${attendance.status} = 'rejected' then 1 else 0 end) as unsigned)`,
        // Compliance rate: approved / total * 100
        complianceRate: sql<number>`cast(
          coalesce(round(
            sum(case when ${attendance.status} = 'approved' then 1 else 0 end) /
            nullif(count(${attendance.id}), 0) * 100
          , 2), 0) as decimal(5,2)
        )`,
      })
      .from(attendance)
      .innerJoin(employees, eq(attendance.employeeCode, employees.employeeCode))
      .where(
        and(
          gte(attendance.checkInTime, startDate),
          lte(attendance.checkInTime, endDate),
          isNotNull(employees.department)
        )
      )
      .groupBy(employees.department)
      .orderBy(sql`compliance_rate desc`);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const departments: DepartmentStats[] = results.map(r => ({
      department: r.department!,
      totalEmployees: r.totalEmployees,
      totalRecords: r.totalRecords,
      approvedCount: r.approvedCount,
      submittedCount: r.submittedCount,
      rejectedCount: r.rejectedCount,
      complianceRate: r.complianceRate,
    }));

    return {
      departments,
      period: {
        year,
        month,
        monthName: monthNames[month - 1],
      },
      generatedAt: new Date(),
    };
  }
}
