import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('salaries')
export class Salary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn()
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  baseSalary: number; // 월 기본급

  @Column({ type: 'date', nullable: true })
  effectiveDate: string; // 적용 시작일

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
