import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { ExtractJwt } from 'passport-jwt';
import { BlacklistService } from '../blacklist/blacklist.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private blacklistService: BlacklistService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req): Promise<{ message: string }> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (token && req.user?.exp) {
      await this.blacklistService.addToBlacklist(token, new Date(req.user.exp * 1000));
    }

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('test')
  async test(@Request() req): Promise<any> {
    return { message: 'JWT validated', user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('hr_admin')
  @Get('admin-only')
  async adminOnly(@Request() req): Promise<any> {
    return { message: 'HR Admin only', user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employee')
  @Get('employee-or-admin')
  async employeeOrAdmin(@Request() req): Promise<any> {
    return { message: 'Employee or HR Admin', user: req.user };
  }
}
