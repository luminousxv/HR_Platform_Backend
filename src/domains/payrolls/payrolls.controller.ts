import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Get,
  Request,
} from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { UpsertSalaryDto } from './dto/upsert-salary.dto';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { UserRole } from 'src/domains/users/enums/user-role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';

@ApiTags('Payrolls (급여)')
@ApiBearerAuth()
@Controller('payrolls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post('salaries/:employeeId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '(관리자) 직원 급여 정보 등록/수정' })
  upsertSalary(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() upsertSalaryDto: UpsertSalaryDto,
  ) {
    return this.payrollsService.upsertSalary(employeeId, upsertSalaryDto);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '(관리자) 해당 월 급여 명세서 일괄 생성' })
  generatePayrolls(@Body() generatePayrollDto: GeneratePayrollDto) {
    return this.payrollsService.generatePayrolls(generatePayrollDto);
  }

  @Get('me')
  @ApiOperation({ summary: '내 급여 명세서 목록 조회' })
  findMyPayrolls(@Request() req: any) {
    return this.payrollsService.findMyPayrolls(req.user);
  }
}
