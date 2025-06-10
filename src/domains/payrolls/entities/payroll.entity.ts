import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

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

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  incomeTax: number; // 소득세

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  nationalPension: number; // 국민연금

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  healthInsurance: number; // 건강보험

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  employmentInsurance: number; // 고용보험

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalDeductions: number; // 공제 합계

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netPay: number; // 실지급액

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
