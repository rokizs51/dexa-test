import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportingService } from './reporting.service';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';
import { EmployeeStatsDto } from './dto/employee-stats.dto';
import { DepartmentStatsDto } from './dto/department-stats.dto';

@Controller()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @MessagePattern({ cmd: 'get_monthly_summary' })
  async getMonthlySummary(@Payload() dto: MonthlySummaryDto) {
    return this.reportingService.getMonthlySummary({
      year: dto.year,
      month: dto.month,
      employeeCode: dto.employeeCode,
    });
  }

  @MessagePattern({ cmd: 'get_employee_stats' })
  async getEmployeeStats(@Payload() dto: EmployeeStatsDto) {
    return this.reportingService.getEmployeeStats({
      year: dto.year,
      month: dto.month,
      employeeCode: dto.employeeCode,
    });
  }

  @MessagePattern({ cmd: 'get_department_stats' })
  async getDepartmentStats(@Payload() dto: DepartmentStatsDto) {
    return this.reportingService.getDepartmentStats({
      year: dto.year,
      month: dto.month,
    });
  }
}
