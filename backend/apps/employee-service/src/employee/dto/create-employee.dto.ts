import { IsString, IsEmail, IsNotEmpty, IsOptional, MaxLength, MinLength, IsDateString, Matches } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Employee code must contain only uppercase letters, numbers, and hyphens',
  })
  employeeCode: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  department?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  position?: string;

  @IsDateString()
  @IsNotEmpty()
  joinDate: string;
}
