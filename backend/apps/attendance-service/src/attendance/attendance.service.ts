import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DrizzleService, attendance, employees } from '@dexa/database';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { DateFilterDto } from './dto/date-filter.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly drizzle: DrizzleService) {}

  async submit(dto: SubmitAttendanceDto) {
    // Server captures timestamp using new Date() - ATT-01 compliance
    const checkInTime = new Date();

    try {
      const result = await this.drizzle.db.insert(attendance).values({
        employeeCode: dto.employeeCode,
        checkInTime,
        photoUrl: dto.photoUrl,
        status: 'submitted',
      });

      return {
        id: result[0].insertId,
        message: 'Attendance submitted successfully',
      };
    } catch (error: any) {
      // Handle duplicate key error - ATT-04 compliance
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        throw new RpcException({
          statusCode: 409,
          message: 'Attendance already submitted for today',
          code: 'DUPLICATE_ATTENDANCE',
        });
      }
      throw error;
    }
  }

  async findByEmployee(employeeCode: string, page = 1, limit = 10, startDate?: string, endDate?: string) {
    const offset = (page - 1) * limit;

    // Build conditions array
    const conditions = [eq(attendance.employeeCode, employeeCode)];

    if (startDate) {
      conditions.push(gte(sql`DATE(${attendance.checkInTime})`, startDate));
    }
    if (endDate) {
      conditions.push(lte(sql`DATE(${attendance.checkInTime})`, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for this employee with filters
    const [countResult] = await this.drizzle.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(attendance)
      .where(whereClause);

    const total = Number(countResult?.count) || 0;

    // Get paginated data ordered by checkInTime descending (most recent first) with employee join
    const data = await this.drizzle.db
      .select({
        id: attendance.id,
        employeeCode: attendance.employeeCode,
        employeeName: employees.fullName,
        department: employees.department,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        photoUrl: attendance.photoUrl,
        checkOutPhotoUrl: attendance.checkOutPhotoUrl,
        totalWorkingHours: attendance.totalWorkingHours,
        status: attendance.status,
        rejectionReason: attendance.rejectionReason,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeCode, employees.employeeCode))
      .where(whereClause)
      .orderBy(desc(attendance.checkInTime))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pageSize: limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findAll(filters: DateFilterDto) {
    const { startDate, endDate, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Build conditions array
    const conditions = [];

    if (startDate) {
      conditions.push(gte(sql`DATE(${attendance.checkInTime})`, startDate));
    }
    if (endDate) {
      conditions.push(lte(sql`DATE(${attendance.checkInTime})`, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await this.drizzle.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(attendance)
      .where(whereClause);

    const total = Number(countResult?.count) || 0;

    // Get paginated data ordered by checkInTime descending with employee join
    const data = await this.drizzle.db
      .select({
        id: attendance.id,
        employeeCode: attendance.employeeCode,
        employeeName: employees.fullName,
        department: employees.department,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        photoUrl: attendance.photoUrl,
        checkOutPhotoUrl: attendance.checkOutPhotoUrl,
        totalWorkingHours: attendance.totalWorkingHours,
        status: attendance.status,
        rejectionReason: attendance.rejectionReason,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
      })
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeCode, employees.employeeCode))
      .where(whereClause)
      .orderBy(desc(attendance.checkInTime))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async findOne(id: number) {
    const [result] = await this.drizzle.db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id))
      .limit(1);
    return result || null;
  }

  async approve(id: number) {
    const record = await this.findOne(id);

    if (!record) {
      throw new RpcException({
        statusCode: 404,
        message: 'Attendance record not found',
      });
    }

    if (record.status !== 'submitted') {
      throw new RpcException({
        statusCode: 400,
        message: 'Cannot approve attendance record',
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    await this.drizzle.db
      .update(attendance)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(attendance.id, id));

    return { message: 'Attendance approved' };
  }

  async reject(id: number, reason: string) {
    if (!reason || reason.trim() === '') {
      throw new RpcException({
        statusCode: 400,
        message: 'Rejection reason is required',
      });
    }

    const record = await this.findOne(id);

    if (!record) {
      throw new RpcException({
        statusCode: 404,
        message: 'Attendance record not found',
      });
    }

    if (record.status !== 'submitted') {
      throw new RpcException({
        statusCode: 400,
        message: 'Cannot reject attendance record',
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    await this.drizzle.db
      .update(attendance)
      .set({ status: 'rejected', rejectionReason: reason, updatedAt: new Date() })
      .where(eq(attendance.id, id));

    return { message: 'Attendance rejected' };
  }

  async clockOut(id: number, photoUrl?: string) {
    const record = await this.findOne(id);

    if (!record) {
      throw new RpcException({
        statusCode: 404,
        message: 'Attendance record not found',
      });
    }

    if (record.checkOutTime) {
      throw new RpcException({
        statusCode: 409,
        message: 'Already clocked out for this record',
        code: 'ALREADY_CLOCKED_OUT',
      });
    }

    const checkOutTime = new Date();

    // Calculate total working hours
    const checkIn = new Date(record.checkInTime);
    const checkOut = new Date(checkOutTime);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    // Format as "8h 30m"
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    const totalWorkingHours = `${hours}h ${minutes}m`;

    await this.drizzle.db
      .update(attendance)
      .set({
        checkOutTime,
        checkOutPhotoUrl: photoUrl || null,
        totalWorkingHours,
        updatedAt: checkOutTime,
      })
      .where(eq(attendance.id, id));

    return {
      id,
      checkInTime: record.checkInTime,
      checkOutTime,
      totalWorkingHours,
      message: 'Clock out successful',
    };
  }

  async findTodayByEmployee(employeeCode: string) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const [result] = await this.drizzle.db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeCode, employeeCode),
          gte(attendance.checkInTime, todayStart),
          lte(attendance.checkInTime, todayEnd)
        )
      )
      .limit(1);

    return result || null;
  }
}
