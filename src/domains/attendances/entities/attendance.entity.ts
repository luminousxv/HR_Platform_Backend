import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, (employee) => employee.id, { eager: true })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({ type: 'date' })
  date: string; // 출근 일자

  @Column({ type: 'timestamptz' })
  clockInTime: Date; // 출근 시간

  @Column({ type: 'timestamptz', nullable: true })
  clockOutTime: Date | null; // 퇴근 시간

  @Column({ type: 'text', nullable: true })
  note: string | null; // 메모

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
