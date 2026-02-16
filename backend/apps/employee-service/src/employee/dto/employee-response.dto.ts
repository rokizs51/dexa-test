export class EmployeeResponseDto {
  id: number;
  employeeCode: string;
  email: string;
  fullName: string;
  department?: string;
  position?: string;
  joinDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
