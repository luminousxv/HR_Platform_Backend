import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@Controller('attendances')
@UseGuards(JwtAuthGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('clock-in')
  clockIn(@Request() req: any, @Body() clockInDto: ClockInDto) {
    // req.user는 JwtStrategy에서 반환된 user 객체입니다. (id, email, role 포함)
    return this.attendancesService.clockIn(req.user.id, clockInDto);
  }

  @Patch('clock-out')
  clockOut(@Request() req: any, @Body() clockOutDto: ClockOutDto) {
    return this.attendancesService.clockOut(req.user.id, clockOutDto);
  }

  @Get('me')
  findMyAttendances(
    @Request() req: any,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.attendancesService.findMyAttendances(req.user.id, year, month);
  }
}
