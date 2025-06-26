import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollsController } from './payrolls.controller';
import { PayrollsService } from './payrolls.service';
import { Payroll } from './entities/payroll.entity';
import { Salary } from './entities/salary.entity';
import { EmployeesModule } from '../employees/employees.module';
import { Employee } from '../employees/entities/employee.entity';
import { PayrollDeduction } from './entities/payroll-deduction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payroll, PayrollDeduction, Salary, Employee]),
    EmployeesModule,
  ],
  controllers: [PayrollsController],
  providers: [PayrollsService],
})
export class PayrollsModule {}
