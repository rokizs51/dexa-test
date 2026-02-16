import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard, RolesGuard, Roles } from '@dexa/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('employees')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class EmployeeController {
  constructor(
    @Inject('EMPLOYEE_SERVICE') private employeeClient: ClientProxy,
  ) {}

  @Roles('hr_admin')
  @Post()
  @ApiOperation({ summary: 'Create a new employee', description: 'Only accessible by HR Admin users' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  async create(@Body() dto: CreateEmployeeDto) {
    return lastValueFrom(
      this.employeeClient.send({ cmd: 'create_employee' }, dto)
    );
  }

  @Roles('hr_admin')
  @Get()
  @ApiOperation({ summary: 'Get all employees with pagination', description: 'Only accessible by HR Admin users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'List of employees retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  async findAll(@Query() query: PaginationDto) {
    return lastValueFrom(
      this.employeeClient.send({ cmd: 'list_employees' }, { page: query.page, limit: query.limit })
    );
  }

  @Roles('hr_admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID', description: 'Only accessible by HR Admin users' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id') id: string) {
    return lastValueFrom(
      this.employeeClient.send({ cmd: 'get_employee' }, { id: parseInt(id, 10) })
    );
  }

  @Roles('hr_admin')
  @Put(':id')
  @ApiOperation({ summary: 'Update an employee', description: 'Only accessible by HR Admin users' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return lastValueFrom(
      this.employeeClient.send({ cmd: 'update_employee' }, { id: parseInt(id, 10), dto })
    );
  }

  @Roles('hr_admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an employee', description: 'Only accessible by HR Admin users' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async remove(@Param('id') id: string) {
    return lastValueFrom(
      this.employeeClient.send({ cmd: 'delete_employee' }, { id: parseInt(id, 10) })
    );
  }
}
