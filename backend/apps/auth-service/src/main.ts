import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file');
import { existsSync, mkdirSync } from 'fs';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  // Create logs directory if it doesn't exist
  const logsDir = process.env.LOGS_DIR || './logs';
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  // Configure logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${context || 'App'}] ${level}: ${message}`;
          }),
        ),
      }),
      new DailyRotateFile({
        filename: `${logsDir}/auth-service-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  // Auto-migrate database in development
  if (process.env.NODE_ENV !== 'production') {
    await new Promise<void>((resolve, reject) => {
      const { spawn } = require('child_process');
      const migrate = spawn('npx', ['drizzle-kit', 'push'], {
        stdio: 'inherit',
        shell: true,
      });
      migrate.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Migration failed with code ${code}`));
      });
    }).catch(() => {
      console.log('Migration failed or tables already exist');
    });
  }

  // Create HTTP server instead of microservice
  const app = await NestFactory.create(AuthServiceModule, { logger });
  
  const port = parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10);
  await app.listen(port);
  app.enableCors();
  console.log(`Auth service listening on port ${port}`);
}
bootstrap();
