import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EmploymentType } from '../enums/employment-type.enum';
import { EmploymentStatus } from '../enums/employment-status.enum';
import { LeaveBalance } from '../../leaves/entities/leave-balance.entity';
import { LeaveRequest } from '../../leaves/entities/leave-request.entity';
import { Salary } from '../../payrolls/entities/salary.entity';
import { Payroll } from '../../payrolls/entities/payroll.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  employeeNumber: string; // 사번

  @Column()
  name: string; // 직원명

  @Column({ type: 'date' })
  joinDate: string; // 입사일

  @Column()
  residentRegistrationNumber: string; // 주민등록번호 (암호화)

  @Column()
  phoneNumber: string; // 연락처

  @Column({ default: '' })
  department: string; // 소속 부서

  @Column({ default: '' })
  position: string; // 직위/직책

  @Column({
    type: 'enum',
    enum: EmploymentType,
  })
  employmentType: EmploymentType; // 고용 형태

  @Column()
  bankName: string; // 은행명

  @Column()
  bankAccountNumber: string; // 계좌번호

  @OneToOne(() => User, { eager: true, cascade: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'date', nullable: true })
  resignationDate: string | null;

  // 직원 1:1 휴가 잔액
  @OneToOne(() => LeaveBalance, (leaveBalance) => leaveBalance.employee)
  leaveBalance: LeaveBalance;

  // 직원 1:N 휴가 요청
  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequest[];

  // 직원 1:1 급여 정보
  @OneToOne(() => Salary, (salary) => salary.employee)
  salary: Salary;

  // 직원 1:N 급여 명세서
  @OneToMany(() => Payroll, (payroll) => payroll.employee)
  payrolls: Payroll[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  status: EmploymentStatus;
}
