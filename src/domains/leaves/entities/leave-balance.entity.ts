import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('leave_balances')
@Unique(['employeeId', 'year'])
export class LeaveBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({ type: 'int' })
  year: number; // 대상 연도

  @Column({ type: 'float', default: 0 })
  totalLeaveDays: number; // 총 부여된 연차

  @Column({ type: 'float', default: 0 })
  usedLeaveDays: number; // 사용한 연차

  get remainingLeaveDays(): number {
    return this.totalLeaveDays - this.usedLeaveDays;
  }
}
