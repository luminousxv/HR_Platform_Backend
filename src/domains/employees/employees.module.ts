import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { UsersModule } from '../users/users.module';
import { Salary } from '../payrolls/entities/salary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Salary]), UsersModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
