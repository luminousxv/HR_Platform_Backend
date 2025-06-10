import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral, FindOperator, IsNull } from 'typeorm';
import { AttendancesService } from './attendances.service';
import { EmployeesService } from '../employees/employees.service';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employees/entities/employee.entity';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('AttendancesService', () => {
  let service: AttendancesService;
  let attendanceRepository: MockRepository<Attendance>;
  let employeesService: any;
  let mockEmployee: Employee;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: createMockRepository<Attendance>(),
        },
        {
          provide: EmployeesService,
          useValue: {
            findOneByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
    attendanceRepository = module.get<MockRepository<Attendance>>(
      getRepositoryToken(Attendance),
    );
    employeesService = module.get(EmployeesService);

    mockEmployee = { id: 'employee-id-1' } as Employee;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clockIn', () => {
    const clockInDto: ClockInDto = { note: 'Clocking in' };
    const userId = 'user-id-1';

    it('should successfully clock in', async () => {
      employeesService.findOneByUserId.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne!.mockResolvedValue(null);
      attendanceRepository.create!.mockImplementation((dto) => dto as any);
      attendanceRepository.save!.mockImplementation((att) =>
        Promise.resolve({ ...att, id: 'attendance-id-1' } as any),
      );

      const result = await service.clockIn(userId, clockInDto);

      expect(employeesService.findOneByUserId).toHaveBeenCalledWith(userId);

      const findOneCall = attendanceRepository.findOne!.mock.calls[0][0];
      expect(findOneCall.where.employeeId).toEqual(mockEmployee.id);
      expect(findOneCall.where.clockInTime).toBeInstanceOf(FindOperator);

      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employee: mockEmployee,
          employeeId: mockEmployee.id,
          note: clockInDto.note,
        }),
      );
      expect(attendanceRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'attendance-id-1');
    });

    it('should throw NotFoundException if employee not found', async () => {
      employeesService.findOneByUserId.mockResolvedValue(null);
      await expect(service.clockIn(userId, clockInDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already clocked in', async () => {
      employeesService.findOneByUserId.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne!.mockResolvedValue({
        id: 'existing-attendance',
      } as Attendance);
      await expect(service.clockIn(userId, clockInDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('clockOut', () => {
    const clockOutDto: ClockOutDto = { note: 'Clocking out' };
    const userId = 'user-id-1';
    let mockAttendance: Attendance;

    beforeEach(() => {
      mockAttendance = {
        id: 'attendance-id-1',
        employee: mockEmployee,
        employeeId: mockEmployee.id,
        date: new Date().toISOString().split('T')[0],
        clockInTime: new Date(),
        clockOutTime: null,
        note: 'Initial note',
      } as Attendance;
    });

    it('should successfully clock out', async () => {
      employeesService.findOneByUserId.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne!.mockResolvedValue(mockAttendance);
      attendanceRepository.save!.mockImplementation((att) =>
        Promise.resolve(att as any),
      );

      const result = await service.clockOut(userId, clockOutDto);

      expect(employeesService.findOneByUserId).toHaveBeenCalledWith(userId);

      const findOneCallClockOut =
        attendanceRepository.findOne!.mock.calls[0][0];
      expect(findOneCallClockOut.where.employeeId).toEqual(mockEmployee.id);
      expect(findOneCallClockOut.where.clockInTime).toBeInstanceOf(
        FindOperator,
      );
      expect(findOneCallClockOut.where.clockOutTime).toEqual(IsNull());

      expect(result.clockOutTime).not.toBeNull();
      expect(result.note).toContain(clockOutDto.note);
      expect(attendanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'attendance-id-1',
          clockOutTime: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if not clocked in', async () => {
      employeesService.findOneByUserId.mockResolvedValue(mockEmployee);
      attendanceRepository.findOne!.mockResolvedValue(null);
      await expect(service.clockOut(userId, clockOutDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
