import { IsString, IsEmail, IsNotEmpty, IsOptional, MaxLength, MinLength, IsDateString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Unique employee code (uppercase letters, numbers, and hyphens only)',
    example: 'EMP-001',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Employee code must contain only uppercase letters, numbers, and hyphens',
  })
  employeeCode: string;

  @ApiProperty({
    description: 'Employee email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Employee password (minimum 8 characters)',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Full name of the employee',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({
    description: 'Department name',
    example: 'Engineering',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({
    description: 'Job position',
    example: 'Software Engineer',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @ApiProperty({
    description: 'Date the employee joined (ISO date string)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  joinDate: string;
}
