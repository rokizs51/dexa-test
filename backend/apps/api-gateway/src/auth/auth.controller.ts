import { Controller, Post, Body, HttpException, HttpStatus, Inject, Logger, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { Public } from '@dexa/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly authServiceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    const host = process.env.AUTH_SERVICE_HOST || 'auth-service';
    this.authServiceUrl = `http://${host}:${process.env.AUTH_SERVICE_PORT || 3001}`;
    this.logger.log(`Auth service URL: ${this.authServiceUrl}`);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Authenticate and get JWT token' })
  @ApiResponse({ status: 201, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for: ${dto.email}`);
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/login`, dto)
      );
      this.logger.log('Login successful');
      return response.data;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @ApiOperation({ summary: 'Logout', description: 'Logout and invalidate token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    this.logger.log('Logout successful');
    return { message: 'Logged out successfully' };
  }
}
