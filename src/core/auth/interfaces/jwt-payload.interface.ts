import { UserRole } from 'src/domains/users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
