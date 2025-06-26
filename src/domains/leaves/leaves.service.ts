import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveBalance } from './entities/leave-balance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Employee } from '../employees/entities/employee.entity';
import { EmployeesService } from '../employees/employees.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveType } from './enums/leave-type.enum';
import { User } from '../users/entities/user.entity';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { LeaveRequestStatus } from './enums/leave-status.enum';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(LeaveBalance)
    private leaveBalanceRepository: Repository<LeaveBalance>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private readonly employeesService: EmployeesService,
  ) {}

  async createLeaveRequest(
    user: User,
    createLeaveRequestDto: CreateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const employee = await this.employeesService.findOneByUserId(user.id);
    if (!employee) {
      throw new NotFoundException('해당 직원을 찾을 수 없습니다.');
    }

    const { leaveType, startDate, endDate, reason } = createLeaveRequestDto;

    // 날짜 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new BadRequestException('시작일은 종료일보다 늦을 수 없습니다.');
    }

    let days = 0;
    if (
      leaveType === LeaveType.HALF_DAY_AM ||
      leaveType === LeaveType.HALF_DAY_PM
    ) {
      if (startDate !== endDate) {
        throw new BadRequestException('반차는 하루만 선택 가능합니다.');
      }
      days = 0.5;
    } else {
      // 주말 제외하고 계산
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // 0: Sunday, 6: Saturday
          days++;
        }
      }
    }

    // 연차일 경우 잔여 연차 확인
    if (leaveType === LeaveType.ANNUAL_LEAVE) {
      const year = new Date(startDate).getFullYear();
      const balance = await this.getLeaveBalance(employee.id, year);
      if (balance.remainingLeaveDays < days) {
        throw new BadRequestException('잔여 연차가 부족합니다.');
      }
    }

    const leaveRequest = this.leaveRequestRepository.create({
      employeeId: employee.id,
      leaveType,
      startDate,
      endDate,
      reason,
      days,
    });

    return this.leaveRequestRepository.save(leaveRequest);
  }

  async findMyLeaveRequests(user: User): Promise<LeaveRequest[]> {
    const employee = await this.employeesService.findOneByUserId(user.id);
    if (!employee) {
      throw new NotFoundException('해당 직원을 찾을 수 없습니다.');
    }
    return this.leaveRequestRepository.find({
      where: { employeeId: employee.id },
      order: { startDate: 'DESC' },
    });
  }

  async findAllLeaveRequests(): Promise<LeaveRequest[]> {
    return this.leaveRequestRepository.find({
      relations: ['employee', 'employee.user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getMyLeaveBalance(user: User): Promise<LeaveBalance> {
    const employee = await this.employeesService.findOneByUserId(user.id);
    if (!employee) {
      throw new NotFoundException('해당 직원을 찾을 수 없습니다.');
    }
    const year = new Date().getFullYear();
    return this.getLeaveBalance(employee.id, year);
  }

  async processLeaveRequest(
    id: string,
    adminUser: User,
    updateDto: UpdateLeaveRequestStatusDto,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id },
    });
    if (!leaveRequest) {
      throw new NotFoundException('해당 휴가 신청을 찾을 수 없습니다.');
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('이미 처리된 휴가 신청입니다.');
    }

    const processorEmployee = await this.employeesService.findOneByUserId(
      adminUser.id,
    );
    if (!processorEmployee) {
      // 관리자 계정이지만 직원 정보가 없는 경우. 이 경우는 시스템 오류에 가깝다.
      throw new NotFoundException(
        '휴가 처리자의 직원 정보를 찾을 수 없습니다.',
      );
    }

    const { status, rejectionReason } = updateDto;

    // 연차 승인/반려 시 잔여 연차 업데이트
    if (leaveRequest.leaveType === LeaveType.ANNUAL_LEAVE) {
      const year = new Date(leaveRequest.startDate).getFullYear();
      const balance = await this.getLeaveBalance(leaveRequest.employeeId, year);

      if (status === LeaveRequestStatus.APPROVED) {
        if (balance.remainingLeaveDays < leaveRequest.days) {
          throw new BadRequestException('처리하려는 직원의 연차가 부족합니다.');
        }
        balance.usedLeaveDays += leaveRequest.days;
        await this.leaveBalanceRepository.save(balance);
      }
    }

    // 반려 사유는 반려 시에만 저장
    if (status === LeaveRequestStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException('반려 시에는 반려 사유를 입력해야 합니다.');
    }

    leaveRequest.status = status;
    leaveRequest.processedById = processorEmployee.id;
    leaveRequest.rejectionReason =
      status === LeaveRequestStatus.REJECTED ? rejectionReason || null : null;

    return this.leaveRequestRepository.save(leaveRequest);
  }

  // 잔여 연차 조회 헬퍼 메서드
  async getLeaveBalance(
    employeeId: string,
    year: number,
  ): Promise<LeaveBalance> {
    let balance = await this.leaveBalanceRepository.findOne({
      where: { employeeId, year },
    });

    if (!balance) {
      // 잔고 정보가 없으면 기본값으로 생성 (실제로는 입사일에 따라 계산 필요)
      // MVP 에서는 일단 15일로 가정
      balance = this.leaveBalanceRepository.create({
        employeeId,
        year,
        totalLeaveDays: 15,
        usedLeaveDays: 0,
      });
      await this.leaveBalanceRepository.save(balance);
    }
    return balance;
  }
}
