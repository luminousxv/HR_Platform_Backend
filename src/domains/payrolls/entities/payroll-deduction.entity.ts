import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payroll } from './payroll.entity';
import { DeductionType } from '../enums/deduction-type.enum';

@Entity('payroll_deductions')
export class PayrollDeduction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payroll, (payroll) => payroll.deductions, {
    onDelete: 'CASCADE',
  })
  payroll: Payroll;

  @Column()
  payrollId: string;

  @Column({
    type: 'enum',
    enum: DeductionType,
  })
  type: DeductionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
