import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { eq, sql, asc } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DrizzleService, employees, users, attendance } from '@dexa/database';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(dto: CreateEmployeeDto) {
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const result = await this.drizzle.db.insert(employees).values({
        employeeCode: dto.employeeCode,
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        department: dto.department,
        position: dto.position,
        joinDate: dto.joinDate,
      });

      return {
        id: result[0].insertId,
        message: 'Employee created successfully',
      };
    } catch (error: any) {
      // Handle duplicate key errors
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        if (error.message?.includes('employee_code') || error.sqlMessage?.includes('employee_code')) {
          throw new RpcException({
            statusCode: 409,
            message: 'Employee code already exists',
            code: 'DUPLICATE_EMPLOYEE_CODE',
          });
        }
        if (error.message?.includes('email') || error.sqlMessage?.includes('email')) {
          throw new RpcException({
            statusCode: 409,
            message: 'Email already exists',
            code: 'DUPLICATE_EMAIL',
          });
        }
      }
      throw error;
    }
  }

  async findOne(id: number) {
    const result = await this.drizzle.db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        email: employees.email,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
        joinDate: employees.joinDate,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .where(eq(employees.id, id));

    return result[0] || null;
  }

  async findByEmployeeCode(employeeCode: string) {
    const result = await this.drizzle.db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        email: employees.email,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
        joinDate: employees.joinDate,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .where(eq(employees.employeeCode, employeeCode));

    return result[0] || null;
  }

  async findAll(page = 1, limit = 10) {
    // Sanitize pagination params
    const sanitizedPage = Math.max(1, parseInt(page as any, 10) || 1);
    const sanitizedLimit = Math.min(100, Math.max(1, parseInt(limit as any, 10) || 10));
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    // Get total count
    const [{ count }] = await this.drizzle.db
      .select({ count: sql<number>`count(*)` })
      .from(employees);

    // Get paginated results - exclude passwordHash
    const data = await this.drizzle.db
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        email: employees.email,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
        joinDate: employees.joinDate,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .orderBy(asc(employees.id))
      .limit(sanitizedLimit)
      .offset(offset);

    const total = Number(count);

    return {
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / sanitizedLimit),
        currentPage: sanitizedPage,
        pageSize: sanitizedLimit,
        hasNextPage: sanitizedPage * sanitizedLimit < total,
        hasPrevPage: sanitizedPage > 1,
      },
    };
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    // Build update object, excluding undefined/null values
    const updateData: any = {};

    if (dto.employeeCode !== undefined) updateData.employeeCode = dto.employeeCode;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.joinDate !== undefined) updateData.joinDate = dto.joinDate;

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();

    await this.drizzle.db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, id));

    return { message: 'Employee updated' };
  }

  async remove(id: number) {
    // Get employee first to retrieve email and employeeCode for cascade delete
    const employee = await this.findOne(id);
    if (!employee) {
      return { message: 'Employee not found' };
    }

    // Delete related auth_users by email
    await this.drizzle.db
      .delete(users)
      .where(eq(users.email, employee.email));

    // Delete related attendance records by employeeCode
    await this.drizzle.db
      .delete(attendance)
      .where(eq(attendance.employeeCode, employee.employeeCode));

    // Finally delete the employee
    await this.drizzle.db
      .delete(employees)
      .where(eq(employees.id, id));

    return { message: 'Employee and all related data deleted' };
  }
}
