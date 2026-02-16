export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  employeeCode?: string | null;
  exp?: number;
}
