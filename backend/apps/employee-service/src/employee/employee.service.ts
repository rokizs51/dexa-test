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
      // Use transaction to ensure both employee and auth user are created together
      const result = await this.drizzle.db.transaction(async (tx) => {
        // 1. Create the employee record
        const employeeResult = await tx.insert(employees).values({
          employeeCode: dto.employeeCode,
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          department: dto.department,
          position: dto.position,
          joinDate: new Date(dto.joinDate).toISOString().split('T')[0],
        });

        const employeeId = employeeResult[0].insertId;

        // 2. Create the auth user record so the employee can login
        await tx.insert(users).values({
          email: dto.email,
          passwordHash,
          role: 'employee',
          isActive: true,
        });

        return { id: employeeId };
      });

      return {
        id: result.id,
        message: 'Employee created successfully',
      };
    } catch (error: any) {
      // Handle duplicate key errors - drizzle-orm throws errors differently
      const errorMessage = error.message || '';
      const sqlMessage = error.sqlMessage || '';
      const errorCode = error.code || '';

      // Check for duplicate entry (MySQL error codes and messages)
      if (
        errorCode === 'ER_DUP_ENTRY' ||
        errorMessage.includes('Duplicate entry') ||
        sqlMessage.includes('Duplicate entry') ||
        errorMessage.includes('Duplicate')
      ) {
        if (sqlMessage.includes('employee_code') || errorMessage.includes('employee_code')) {
          throw new RpcException({
            statusCode: 409,
            message: 'Employee code already exists',
            code: 'DUPLICATE_EMPLOYEE_CODE',
          });
        }
        if (sqlMessage.includes('email') || errorMessage.includes('email')) {
          throw new RpcException({
            statusCode: 409,
            message: 'Email already exists',
            code: 'DUPLICATE_EMAIL',
          });
        }
      }

      // Log the actual error for debugging
      console.error('Employee creation error:', error);

      // Re-throw with a more descriptive error
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to create employee: ' + (errorMessage || 'Unknown error'),
        code: 'CREATE_EMPLOYEE_FAILED',
      });
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
    if (dto.joinDate !== undefined) {
      // Convert joinDate to YYYY-MM-DD format for MySQL DATE type
      const dateObj = new Date(dto.joinDate);
      updateData.joinDate = dateObj.toISOString().split('T')[0];
    }

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
