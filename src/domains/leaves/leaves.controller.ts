import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { UserRole } from 'src/domains/users/enums/user-role.enum';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';

@ApiTags('Leaves (휴가)')
@ApiBearerAuth()
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '휴가 신청' })
  create(
    @Request() req: any,
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    return this.leavesService.createLeaveRequest(
      req.user,
      createLeaveRequestDto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 휴가 신청 내역 조회' })
  findMyLeaveRequests(@Request() req: any) {
    return this.leavesService.findMyLeaveRequests(req.user);
  }

  @Get('balance/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 잔여 연차 조회' })
  getMyLeaveBalance(@Request() req: any) {
    return this.leavesService.getMyLeaveBalance(req.user);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '(관리자) 모든 휴가 신청 목록 조회' })
  findAllLeaveRequests() {
    return this.leavesService.findAllLeaveRequests();
  }

  @Patch('admin/:id/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '(관리자) 휴가 신청 처리' })
  processLeaveRequest(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateDto: UpdateLeaveRequestStatusDto,
  ) {
    return this.leavesService.processLeaveRequest(id, req.user, updateDto);
  }
}
