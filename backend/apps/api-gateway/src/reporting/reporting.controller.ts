import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard, RolesGuard, Roles } from '@dexa/common';
import { lastValueFrom } from 'rxjs';

@ApiTags('reporting')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Roles('hr_admin')
export class ReportingController {
  constructor(
    @Inject('ATTENDANCE_SERVICE') private attendanceClient: ClientProxy,
  ) {}

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Get monthly attendance summary', description: 'Get monthly summary of attendance records. Only accessible by HR Admin.' })
  @ApiQuery({ name: 'year', required: true, type: Number, description: 'Year (e.g., 2024)' })
  @ApiQuery({ name: 'month', required: true, type: Number, description: 'Month (1-12)' })
  @ApiQuery({ name: 'employeeCode', required: false, type: String, description: 'Filter by specific employee code' })
  @ApiResponse({ status: 200, description: 'Monthly summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  async getMonthlySummary(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('employeeCode') employeeCode?: string,
  ) {
    return lastValueFrom(
      this.attendanceClient.send(
        { cmd: 'get_monthly_summary' },
        {
          year: parseInt(year, 10),
          month: parseInt(month, 10),
          employeeCode,
        }
      )
    );
  }

  @Get('employee-stats')
  @ApiOperation({ summary: 'Get employee attendance statistics', description: 'Get detailed attendance statistics for a specific employee. Only accessible by HR Admin.' })
  @ApiQuery({ name: 'year', required: true, type: Number, description: 'Year (e.g., 2024)' })
  @ApiQuery({ name: 'month', required: true, type: Number, description: 'Month (1-12)' })
  @ApiQuery({ name: 'employeeCode', required: true, type: String, description: 'Employee code' })
  @ApiResponse({ status: 200, description: 'Employee stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  async getEmployeeStats(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('employeeCode') employeeCode: string,
  ) {
    return lastValueFrom(
      this.attendanceClient.send(
        { cmd: 'get_employee_stats' },
        {
          year: parseInt(year, 10),
          month: parseInt(month, 10),
          employeeCode,
        }
      )
    );
  }

  @Get('department-stats')
  @ApiOperation({ summary: 'Get department statistics', description: 'Get attendance statistics grouped by department. Only accessible by HR Admin.' })
  @ApiQuery({ name: 'year', required: true, type: Number, description: 'Year (e.g., 2024)' })
  @ApiQuery({ name: 'month', required: true, type: Number, description: 'Month (1-12)' })
  @ApiResponse({ status: 200, description: 'Department stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  async getDepartmentStats(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return lastValueFrom(
      this.attendanceClient.send(
        { cmd: 'get_department_stats' },
        {
          year: parseInt(year, 10),
          month: parseInt(month, 10),
        }
      )
    );
  }
}
