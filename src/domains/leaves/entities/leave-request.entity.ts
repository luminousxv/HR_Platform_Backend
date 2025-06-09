import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { LeaveType } from '../enums/leave-type.enum';
import { LeaveRequestStatus } from '../enums/leave-status.enum';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({ type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  @Column({
    type: 'enum',
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.PENDING,
  })
  status: LeaveRequestStatus;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'float' })
  days: number; // 사용 일수 (반차의 경우 0.5)

  @Column({ type: 'text' })
  reason: string; // 신청 사유

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null; // 반려 사유

  @ManyToOne(() => Employee, { nullable: true })
  processedBy: Employee | null; // 처리한 관리자 정보

  @Column({ nullable: true })
  processedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
