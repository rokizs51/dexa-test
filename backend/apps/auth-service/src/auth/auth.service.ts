import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DrizzleService } from '@dexa/database';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '@dexa/database/auth/schema';
import { employees } from '@dexa/database/employee/schema';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private drizzle: DrizzleService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const result = await this.drizzle.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(user: any): Promise<{ access_token: string; user: any }> {
    // Fetch employee data to get employeeCode
    const employeeResult = await this.drizzle.db
      .select()
      .from(employees)
      .where(eq(employees.email, user.email))
      .limit(1);

    const employee = employeeResult[0];
    const employeeCode = employee?.employeeCode || null;

    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      employeeCode,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: employee?.fullName || user.email.split('@')[0],
        department: employee?.department || null,
        position: employee?.position || null,
        employeeCode,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
