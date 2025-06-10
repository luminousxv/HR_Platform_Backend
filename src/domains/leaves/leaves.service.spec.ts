import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { LeavesService } from './leaves.service';
import { EmployeesService } from '../employees/employees.service';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { Employee } from '../employees/entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveType } from './enums/leave-type.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { LeaveRequestStatus } from './enums/leave-status.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('LeavesService', () => {
  let service: LeavesService;
  let leaveRequestRepository: MockRepository<LeaveRequest>;
  let leaveBalanceRepository: MockRepository<LeaveBalance>;
  let employeeRepository: MockRepository<Employee>;
  let employeesService: any;
  let mockUser: User;
  let mockEmployee: Employee;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,
        {
          provide: getRepositoryToken(LeaveRequest),
          useValue: createMockRepository<LeaveRequest>(),
        },
        {
          provide: getRepositoryToken(LeaveBalance),
          useValue: createMockRepository<LeaveBalance>(),
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: createMockRepository<Employee>(),
        },
        {
          provide: EmployeesService,
          useValue: {
            findOneByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
    leaveRequestRepository = module.get(getRepositoryToken(LeaveRequest));
    leaveBalanceRepository = module.get(getRepositoryToken(LeaveBalance));
    employeeRepository = module.get(getRepositoryToken(Employee));
    employeesService = module.get(EmployeesService);

    mockUser = { id: 'user-id-1' } as User;
    mockEmployee = { id: 'employee-id-1' } as Employee;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLeaveRequest', () => {
    let createLeaveRequestDto: CreateLeaveRequestDto;

    beforeEach(() => {
      createLeaveRequestDto = {
        leaveType: LeaveType.ANNUAL_LEAVE,
        startDate: '2024-01-10',
        endDate: '2024-01-11', // 2 days
        reason: 'Vacation',
      };
      employeesService.findOneByUserId.mockResolvedValue(mockEmployee);
    });

    it('should create an annual leave request successfully', async () => {
      const mockBalance = {
        employeeId: mockEmployee.id,
        year: 2024,
        remainingLeaveDays: 10,
      } as LeaveBalance;
      jest.spyOn(service, 'getLeaveBalance').mockResolvedValue(mockBalance);
      leaveRequestRepository.create!.mockImplementation((dto) => dto as any);
      leaveRequestRepository.save!.mockImplementation((req) =>
        Promise.resolve({ ...req, id: 'request-id-1' } as any),
      );

      const result = await service.createLeaveRequest(
        mockUser,
        createLeaveRequestDto,
      );

      expect(service.getLeaveBalance).toHaveBeenCalledWith(
        mockEmployee.id,
        2024,
      );
      expect(leaveRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          days: 2,
        }),
      );
      expect(result).toHaveProperty('id', 'request-id-1');
    });

    it('should create a half-day leave request successfully', async () => {
      createLeaveRequestDto.leaveType = LeaveType.HALF_DAY_AM;
      createLeaveRequestDto.endDate = createLeaveRequestDto.startDate;

      leaveRequestRepository.create!.mockImplementation((dto) => dto as any);
      leaveRequestRepository.save!.mockImplementation((req) =>
        Promise.resolve({ ...req, id: 'request-id-2' } as any),
      );

      const result = await service.createLeaveRequest(
        mockUser,
        createLeaveRequestDto,
      );

      expect(leaveRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          days: 0.5,
        }),
      );
      expect(result).toHaveProperty('id', 'request-id-2');
    });

    it('should throw BadRequestException for insufficient leave balance', async () => {
      const mockBalance = {
        employeeId: mockEmployee.id,
        year: 2024,
        remainingLeaveDays: 1,
      } as LeaveBalance;
      jest.spyOn(service, 'getLeaveBalance').mockResolvedValue(mockBalance);

      await expect(
        service.createLeaveRequest(mockUser, createLeaveRequestDto),
      ).rejects.toThrow(new BadRequestException('잔여 연차가 부족합니다.'));
    });

    it('should throw BadRequestException for invalid date range', async () => {
      createLeaveRequestDto.startDate = '2024-01-12';
      createLeaveRequestDto.endDate = '2024-01-11';

      await expect(
        service.createLeaveRequest(mockUser, createLeaveRequestDto),
      ).rejects.toThrow(
        new BadRequestException('시작일은 종료일보다 늦을 수 없습니다.'),
      );
    });

    it('should throw NotFoundException if employee not found', async () => {
      employeesService.findOneByUserId.mockResolvedValue(null);
      await expect(
        service.createLeaveRequest(mockUser, createLeaveRequestDto),
      ).rejects.toThrow(new NotFoundException('해당 직원을 찾을 수 없습니다.'));
    });
  });

  describe('processLeaveRequest', () => {
    let updateDto: UpdateLeaveRequestStatusDto;
    let mockLeaveRequest: LeaveRequest;
    let mockProcessorEmployee: Employee;
    let mockAdminUser: User;

    beforeEach(() => {
      mockLeaveRequest = {
        id: 'request-id-1',
        employeeId: 'employee-id-1',
        leaveType: LeaveType.ANNUAL_LEAVE,
        startDate: '2024-01-10',
        endDate: '2024-01-11',
        days: 2,
        status: LeaveRequestStatus.PENDING,
      } as LeaveRequest;

      mockProcessorEmployee = { id: 'admin-employee-id' } as Employee;
      mockAdminUser = { id: 'admin-user-id' } as User;

      updateDto = {
        status: LeaveRequestStatus.APPROVED,
        rejectionReason: undefined,
      };

      leaveRequestRepository.findOne!.mockResolvedValue(mockLeaveRequest);
      employeesService.findOneByUserId.mockResolvedValue(mockProcessorEmployee);
    });

    it('should approve an annual leave request and update balance', async () => {
      const mockBalance = {
        employeeId: mockLeaveRequest.employeeId,
        year: 2024,
        usedLeaveDays: 5,
        remainingLeaveDays: 10,
      } as LeaveBalance;
      jest.spyOn(service, 'getLeaveBalance').mockResolvedValue(mockBalance);
      leaveRequestRepository.save!.mockImplementation((req) =>
        Promise.resolve(req as any),
      );

      const result = await service.processLeaveRequest(
        mockLeaveRequest.id,
        mockAdminUser,
        updateDto,
      );

      expect(service.getLeaveBalance).toHaveBeenCalledWith(
        mockLeaveRequest.employeeId,
        2024,
      );
      expect(leaveBalanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usedLeaveDays: 7, // 5 + 2
        }),
      );
      expect(result.status).toEqual(LeaveRequestStatus.APPROVED);
      expect(result.processedById).toEqual(mockProcessorEmployee.id);
    });

    it('should reject a leave request with a reason', async () => {
      updateDto.status = LeaveRequestStatus.REJECTED;
      updateDto.rejectionReason = 'Project deadline';

      // getLeaveBalance is called even for rejection if leaveType is ANNUAL_LEAVE.
      // So, we need to mock findOne to prevent save from being called inside getLeaveBalance.
      const mockBalance = { id: 'balance-id' } as LeaveBalance;
      leaveBalanceRepository.findOne!.mockResolvedValue(mockBalance);

      leaveRequestRepository.save!.mockImplementation((req) =>
        Promise.resolve(req as any),
      );

      const result = await service.processLeaveRequest(
        mockLeaveRequest.id,
        mockAdminUser,
        updateDto,
      );

      expect(leaveBalanceRepository.save).not.toHaveBeenCalled();
      expect(result.status).toEqual(LeaveRequestStatus.REJECTED);
      expect(result.rejectionReason).toEqual(updateDto.rejectionReason);
    });

    it('should throw BadRequestException when trying to approve with insufficient balance', async () => {
      const mockBalance = {
        employeeId: mockLeaveRequest.employeeId,
        year: 2024,
        remainingLeaveDays: 1,
      } as LeaveBalance; // only 1 day left
      jest.spyOn(service, 'getLeaveBalance').mockResolvedValue(mockBalance);

      await expect(
        service.processLeaveRequest(
          mockLeaveRequest.id,
          mockAdminUser,
          updateDto,
        ),
      ).rejects.toThrow(
        new BadRequestException('처리하려는 직원의 연차가 부족합니다.'),
      );
    });

    it('should throw BadRequestException when rejecting without a reason', async () => {
      updateDto.status = LeaveRequestStatus.REJECTED;
      updateDto.rejectionReason = ''; // empty reason

      await expect(
        service.processLeaveRequest(
          mockLeaveRequest.id,
          mockAdminUser,
          updateDto,
        ),
      ).rejects.toThrow(
        new BadRequestException('반려 시에는 반려 사유를 입력해야 합니다.'),
      );
    });

    it('should throw BadRequestException for already processed request', async () => {
      mockLeaveRequest.status = LeaveRequestStatus.APPROVED;

      await expect(
        service.processLeaveRequest(
          mockLeaveRequest.id,
          mockAdminUser,
          updateDto,
        ),
      ).rejects.toThrow(
        new BadRequestException('이미 처리된 휴가 신청입니다.'),
      );
    });
  });
});
