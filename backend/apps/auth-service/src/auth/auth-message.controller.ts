import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { BlacklistService } from '../blacklist/blacklist.service';

@Controller()
export class AuthMessageController {
  private readonly logger = new Logger(AuthMessageController.name);

  constructor(
    private authService: AuthService,
    private blacklistService: BlacklistService,
  ) {
    this.logger.log('[AuthMessageController] Constructor - AuthMessageController instantiated');
  }

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: { email: string; password: string }) {
    this.logger.log('[AuthMessageController] Received login message with pattern "login"');
    this.logger.log('[AuthMessageController] Payload data:', JSON.stringify(data));
    
    try {
      const user = await this.authService.validateUser(data.email, data.password);

      if (!user) {
        this.logger.warn('[AuthMessageController] Invalid credentials for:', data.email);
        return {
          statusCode: 401,
          message: 'Invalid credentials',
        };
      }

      this.logger.log('[AuthMessageController] User found, generating token');
      return this.authService.login(user);
    } catch (error) {
      this.logger.error('[AuthMessageController] Error during login:', error.message);
      return {
        statusCode: 500,
        message: error.message,
      };
    }
  }

  @MessagePattern('validate_token')
  async validateToken(@Payload() data: { token: string }) {
    this.logger.log('[AuthMessageController] Received validate_token message');
    return { valid: true };
  }
}
