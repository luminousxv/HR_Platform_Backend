import { Module } from '@nestjs/common';
import { UsersModule } from './domains/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './core/auth/auth.module';
import { EmployeesModule } from './domains/employees/employees.module';
import { SharedModule } from './shared/shared.module';
import { AttendancesModule } from './domains/attendances/attendances.module';
import { LeavesModule } from './domains/leaves/leaves.module';
import { PayrollsModule } from './domains/payrolls/payrolls.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    EmployeesModule,
    SharedModule,
    AttendancesModule,
    LeavesModule,
    PayrollsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
