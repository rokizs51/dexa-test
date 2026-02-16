import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as winston from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file');
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { JwtAuthGuard } from '@dexa/common';

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
        filename: `${logsDir}/gateway-%DATE%.log`,
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

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });

  // Enable CORS for Swagger UI
  app.enableCors();

  // Serve static files for uploaded attendance photos
  const uploadsDir = process.env.UPLOADS_DIR || './uploads';
  if (existsSync(uploadsDir)) {
    app.useStaticAssets(uploadsDir, {
      prefix: '/files/',
    });
    console.log(`Serving static files from: ${uploadsDir}`);
  }

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('DEXA Backend API')
    .setDescription('WFH Attendance Application - Microservices Backend API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('employees', 'Employee management endpoints')
    .addTag('attendance', 'Attendance tracking endpoints')
    .addTag('files', 'File upload endpoints')
    .addTag('reporting', 'HR reporting endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Apply global JWT guard (except routes marked with @Public())
  app.useGlobalGuards(new JwtAuthGuard(app.get('Reflector')));

  // Start HTTP server
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
