import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { PayrollDeduction } from './payroll-deduction.entity';

@Entity('payrolls')
@Unique(['employeeId', 'paymentMonth'])
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({ type: 'date' })
  paymentMonth: string; // 지급 연월 (YYYY-MM-01 형식)

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseSalary: number; // 기본급

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  bonus: number; // 상여금

  @OneToMany(() => PayrollDeduction, (deduction) => deduction.payroll, {
    cascade: true,
  })
  deductions: PayrollDeduction[];

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalDeductions: number; // 공제 합계

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netPay: number; // 실지급액

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
