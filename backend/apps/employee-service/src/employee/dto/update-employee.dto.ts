import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';

// Omit password, then make remaining fields optional
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, ['password'] as const)) {}
