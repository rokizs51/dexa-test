import {
  Controller,
  Post,
  Get,
  Put,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Inject,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  Query,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard, RolesGuard, Roles } from '@dexa/common';
import { Request } from 'express';
import { DateFilterDto } from './dto/date-filter.dto';

interface RequestWithUser extends Request {
  user: {
    employeeCode: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

@ApiTags('attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(
    @Inject('FILE_SERVICE') private fileClient: ClientProxy,
    @Inject('ATTENDANCE_SERVICE') private attendanceClient: ClientProxy,
  ) {}

  @Roles('employee')
  @Post('submit')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Submit attendance with photo', description: 'Submit daily attendance with a photo. Requires employee role.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Attendance submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires employee role' })
  async submitAttendance(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    photo: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(`Attendance submit request from employee: ${req.user.employeeCode}`);
    this.logger.log(`Photo details: name=${photo.originalname}, size=${photo.size}, type=${photo.mimetype}`);

    try {
      // Step 1: Upload file to File Service
      this.logger.log('Step 1: Uploading file to File Service...');
      const filePayload = {
        buffer: photo.buffer.toString('base64'),
        originalName: photo.originalname,
        mimeType: photo.mimetype,
        size: photo.size,
      };

      const fileResult = await lastValueFrom(
        this.fileClient.send({ cmd: 'upload_file' }, filePayload)
      );
      this.logger.log(`File uploaded successfully: ${JSON.stringify(fileResult)}`);

      // Step 2: Submit attendance with employeeCode from JWT and photoUrl from file result
      this.logger.log('Step 2: Submitting attendance to Attendance Service...');
      const attendancePayload = {
        employeeCode: req.user.employeeCode,
        photoUrl: fileResult.url,
      };
      this.logger.log(`Attendance payload: ${JSON.stringify(attendancePayload)}`);

      const attendanceResult = await lastValueFrom(
        this.attendanceClient.send({ cmd: 'submit_attendance' }, attendancePayload)
      );
      this.logger.log(`Attendance submitted successfully: ${JSON.stringify(attendanceResult)}`);

      return attendanceResult;
    } catch (error) {
      this.logger.error(`Error submitting attendance: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Roles('employee')
  @Get('my-history')
  @ApiOperation({ summary: 'Get my attendance history', description: 'Get attendance history for the logged-in employee' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires employee role' })
  async getMyHistory(
    @Query() query: { page?: number; limit?: number; startDate?: string; endDate?: string },
    @Req() req: RequestWithUser,
  ) {
    const employeeCode = req.user.employeeCode;
    return lastValueFrom(
      this.attendanceClient.send(
        { cmd: 'get_my_attendance' },
        { employeeCode, page: query.page, limit: query.limit, startDate: query.startDate, endDate: query.endDate },
      )
    );
  }

  @Roles('hr_admin')
  @Get()
  @ApiOperation({ summary: 'Get all attendance records', description: 'Get all attendance records with date filters. Only accessible by HR Admin.' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  async findAll(@Query() query: DateFilterDto) {
    return lastValueFrom(
      this.attendanceClient.send({ cmd: 'list_attendance' }, query)
    );
  }

  @Roles('hr_admin')
  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve attendance', description: 'Approve an attendance record. Only accessible by HR Admin.' })
  @ApiParam({ name: 'id', description: 'Attendance ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Attendance approved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async approve(@Param('id') id: string) {
    const parsedId = parseInt(id, 10);
    return lastValueFrom(
      this.attendanceClient.send({ cmd: 'approve_attendance' }, { id: parsedId })
    );
  }

  @Roles('hr_admin')
  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject attendance', description: 'Reject an attendance record with a reason. Only accessible by HR Admin.' })
  @ApiParam({ name: 'id', description: 'Attendance ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Attendance rejected successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - reason required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires HR Admin role' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const parsedId = parseInt(id, 10);
    return lastValueFrom(
      this.attendanceClient.send(
        { cmd: 'reject_attendance' },
        { id: parsedId, reason: body.reason },
      )
    );
  }

  @Roles('employee')
  @Post('clock-out/:id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Clock out', description: 'Clock out for the day with optional photo' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Attendance ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Clock out successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires employee role' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  @ApiResponse({ status: 409, description: 'Already clocked out' })
  async clockOut(
    @Param('id') id: string,
    @UploadedFile() photo: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    const parsedId = parseInt(id, 10);

    try {
      // Optional: Upload photo if provided
      let photoUrl: string | undefined;
      if (photo) {
        this.logger.log('Uploading clock-out photo...');
        const fileResult = await lastValueFrom(
          this.fileClient.send({ cmd: 'upload_file' }, {
            buffer: photo.buffer.toString('base64'),
            originalName: photo.originalname,
            mimeType: photo.mimetype,
            size: photo.size,
          })
        );
        photoUrl = fileResult.url;
        this.logger.log(`Clock-out photo uploaded: ${photoUrl}`);
      }

      this.logger.log(`Clock out request for attendance ID: ${parsedId} by employee: ${req.user.employeeCode}`);

      return lastValueFrom(
        this.attendanceClient.send(
          { cmd: 'clock_out' },
          { id: parsedId, photoUrl }
        )
      );
    } catch (error) {
      this.logger.error(`Error during clock out: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Roles('employee')
  @Get('today')
  @ApiOperation({ summary: 'Get today attendance', description: 'Get today attendance record for the logged-in employee' })
  @ApiResponse({ status: 200, description: 'Today attendance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTodayAttendance(@Req() req: RequestWithUser) {
    return lastValueFrom(
      this.attendanceClient.send(
        { cmd: 'get_today_attendance' },
        { employeeCode: req.user.employeeCode }
      )
    );
  }
}
