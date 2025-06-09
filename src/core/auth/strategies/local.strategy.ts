import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from 'src/domains/users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pass: string): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호를 확인해주세요.');
    }
    return user;
  }
}
