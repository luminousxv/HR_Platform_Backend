import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/domains/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Request() req: { user: Omit<User, 'password'> },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(req.user);
  }
}
