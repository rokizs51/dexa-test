import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AttendanceService } from './attendance.service';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { DateFilterDto } from './dto/date-filter.dto';
import { ApproveAttendanceDto, RejectAttendanceDto } from './dto/approve-attendance.dto';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern({ cmd: 'submit_attendance' })
  async submit(@Payload() dto: SubmitAttendanceDto) {
    return this.attendanceService.submit(dto);
  }

  @MessagePattern({ cmd: 'get_my_attendance' })
  async getMyAttendance(@Payload() data: { employeeCode: string; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    return this.attendanceService.findByEmployee(
      data.employeeCode,
      data.page,
      data.limit,
      data.startDate,
      data.endDate
    );
  }

  @MessagePattern({ cmd: 'list_attendance' })
  async listAttendance(@Payload() data: DateFilterDto) {
    return this.attendanceService.findAll(data);
  }

  @MessagePattern({ cmd: 'approve_attendance' })
  async approve(@Payload() data: ApproveAttendanceDto) {
    return this.attendanceService.approve(data.id);
  }

  @MessagePattern({ cmd: 'reject_attendance' })
  async reject(@Payload() data: RejectAttendanceDto) {
    return this.attendanceService.reject(data.id, data.reason);
  }

  @MessagePattern({ cmd: 'clock_out' })
  async clockOut(@Payload() data: { id: number; photoUrl?: string }) {
    return this.attendanceService.clockOut(data.id, data.photoUrl);
  }

  @MessagePattern({ cmd: 'get_today_attendance' })
  async getTodayAttendance(@Payload() data: { employeeCode: string }) {
    return this.attendanceService.findTodayByEmployee(data.employeeCode);
  }
}
