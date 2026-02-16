import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern({ cmd: 'create_employee' })
  async create(@Payload() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @MessagePattern({ cmd: 'get_employee' })
  async findOne(@Payload() data: { id: number }) {
    const employee = await this.employeeService.findOne(data.id);
    if (!employee) {
      throw new RpcException({
        statusCode: 404,
        message: 'Employee not found',
      });
    }
    return employee;
  }

  @MessagePattern({ cmd: 'get_employee_by_code' })
  async findByCode(@Payload() data: { employeeCode: string }) {
    const employee = await this.employeeService.findByEmployeeCode(data.employeeCode);
    if (!employee) {
      throw new RpcException({
        statusCode: 404,
        message: 'Employee not found',
      });
    }
    return employee;
  }

  @MessagePattern({ cmd: 'list_employees' })
  async findAll(@Payload() data: { page?: number; limit?: number }) {
    return this.employeeService.findAll(data.page, data.limit);
  }

  @MessagePattern({ cmd: 'update_employee' })
  async update(@Payload() data: { id: number; dto: UpdateEmployeeDto }) {
    // First check if employee exists
    const existing = await this.employeeService.findOne(data.id);
    if (!existing) {
      throw new RpcException({
        statusCode: 404,
        message: 'Employee not found',
      });
    }
    return this.employeeService.update(data.id, data.dto);
  }

  @MessagePattern({ cmd: 'delete_employee' })
  async remove(@Payload() data: { id: number }) {
    // First check if employee exists
    const existing = await this.employeeService.findOne(data.id);
    if (!existing) {
      throw new RpcException({
        statusCode: 404,
        message: 'Employee not found',
      });
    }
    return this.employeeService.remove(data.id);
  }
}
