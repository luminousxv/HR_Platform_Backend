import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { EmployeesService } from '../employees/employees.service';
import { Employee } from '../employees/entities/employee.entity';

@Injectable()
export class AttendancesService {
  constructor(
    @InjectRepository(Attendance)
    private attendancesRepository: Repository<Attendance>,
    private employeesService: EmployeesService,
  ) {}

  private async findEmployeeByUserId(userId: string): Promise<Employee> {
    // EmployeesService에는 userId로 employee를 찾는 메서드가 없으므로,
    // employee repository에서 직접 조회하거나, EmployeesService에 해당 기능을 추가해야 합니다.
    // 여기서는 EmployeesService에 추가했다고 가정하고 진행합니다. (추후 추가 필요)
    const employee = await this.employeesService.findOneByUserId(userId);
    if (!employee) {
      throw new NotFoundException(`Employee not found for user ID: ${userId}`);
    }
    return employee;
  }

  async clockIn(userId: string, clockInDto: ClockInDto): Promise<Attendance> {
    const employee = await this.findEmployeeByUserId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existingAttendance = await this.attendancesRepository.findOne({
      where: {
        employeeId: employee.id,
        clockInTime: Between(today, tomorrow),
      },
    });

    if (existingAttendance) {
      throw new ConflictException('Already clocked in today.');
    }

    const newAttendance = this.attendancesRepository.create({
      employee,
      employeeId: employee.id,
      date: today.toISOString().split('T')[0], // YYYY-MM-DD
      clockInTime: new Date(),
      note: clockInDto.note,
    });

    return this.attendancesRepository.save(newAttendance);
  }

  async clockOut(
    userId: string,
    clockOutDto: ClockOutDto,
  ): Promise<Attendance> {
    const employee = await this.findEmployeeByUserId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendanceToUpdate = await this.attendancesRepository.findOne({
      where: {
        employeeId: employee.id,
        clockInTime: Between(today, tomorrow),
        clockOutTime: IsNull(),
      },
    });

    if (!attendanceToUpdate) {
      throw new NotFoundException(
        'Clock-in record not found for today or already clocked out.',
      );
    }

    attendanceToUpdate.clockOutTime = new Date();
    if (clockOutDto.note) {
      attendanceToUpdate.note =
        (attendanceToUpdate.note ? attendanceToUpdate.note + '\n' : '') +
        `퇴근 메모: ${clockOutDto.note}`;
    }

    return this.attendancesRepository.save(attendanceToUpdate);
  }

  async findMyAttendances(
    userId: string,
    year: number,
    month: number,
  ): Promise<Attendance[]> {
    const employee = await this.findEmployeeByUserId(userId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.attendancesRepository.find({
      where: {
        employeeId: employee.id,
        date: Between(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
        ),
      },
      order: {
        date: 'ASC',
      },
    });
  }

  async findAllAttendances(year: number, month: number): Promise<Attendance[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.attendancesRepository.find({
      where: {
        clockInTime: Between(startDate, endDate),
      },
      relations: ['employee', 'employee.user'],
      order: {
        clockInTime: 'DESC',
      },
    });
  }
}
