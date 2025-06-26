import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { UserRole } from 'src/domains/users/enums/user-role.enum';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('attendances')
@UseGuards(JwtAuthGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('clock-in')
  clockIn(
    @Request() req: AuthenticatedRequest,
    @Body() clockInDto: ClockInDto,
  ) {
    // req.user는 JwtStrategy에서 반환된 user 객체입니다. (id, email, role 포함)
    return this.attendancesService.clockIn(req.user.id, clockInDto);
  }

  @Post('clock-out')
  clockOut(
    @Request() req: AuthenticatedRequest,
    @Body() clockOutDto: ClockOutDto,
  ) {
    return this.attendancesService.clockOut(req.user.id, clockOutDto);
  }

  @Get('me')
  findMyAttendances(
    @Request() req: AuthenticatedRequest,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.attendancesService.findMyAttendances(req.user.id, year, month);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAttendances(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.attendancesService.findAllAttendances(year, month);
  }
}
