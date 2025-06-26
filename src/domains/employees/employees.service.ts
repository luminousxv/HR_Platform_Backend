import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CryptoService } from '../../shared/services/crypto.service';
import { UsersService } from '../users/users.service';
import { Salary } from '../payrolls/entities/salary.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
    @InjectRepository(Salary)
    private salaryRepository: Repository<Salary>,
    private readonly cryptoService: CryptoService,
    private readonly usersService: UsersService,
  ) {}

  private decryptEmployee(employee: Employee): Employee {
    if (employee.residentRegistrationNumber) {
      employee.residentRegistrationNumber = this.cryptoService.decrypt(
        employee.residentRegistrationNumber,
      );
    }
    if (employee.bankAccountNumber) {
      employee.bankAccountNumber = this.cryptoService.decrypt(
        employee.bankAccountNumber,
      );
    }
    return employee;
  }

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const {
      userId,
      residentRegistrationNumber,
      bankAccountNumber,
      baseSalary,
      effectiveDate,
      ...rest
    } = createEmployeeDto;

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const existingEmployee = await this.employeesRepository.findOne({
      where: { userId },
    });
    if (existingEmployee) {
      throw new ConflictException(
        `Employee for user ID "${userId}" already exists`,
      );
    }

    const encryptedRrn = this.cryptoService.encrypt(residentRegistrationNumber);
    const encryptedBan = this.cryptoService.encrypt(bankAccountNumber);

    const employee = this.employeesRepository.create({
      ...rest,
      residentRegistrationNumber: encryptedRrn,
      bankAccountNumber: encryptedBan,
      user,
      userId,
    });

    const savedEmployee = await this.employeesRepository.save(employee);

    if (baseSalary && effectiveDate) {
      const salary = this.salaryRepository.create({
        employeeId: savedEmployee.id,
        baseSalary,
        effectiveDate,
      });
      await this.salaryRepository.save(salary);
    }

    return this.decryptEmployee(savedEmployee);
  }

  async findAll(): Promise<Employee[]> {
    const employees = await this.employeesRepository.find({
      relations: ['user'],
    });
    return employees.map((emp) => this.decryptEmployee(emp));
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return this.decryptEmployee(employee);
  }

  async findOneByUserId(userId: string): Promise<Employee | null> {
    const employee = await this.employeesRepository.findOne({
      where: { userId },
    });
    if (!employee) {
      return null;
    }
    return this.decryptEmployee(employee);
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    if (updateEmployeeDto.residentRegistrationNumber) {
      updateEmployeeDto.residentRegistrationNumber = this.cryptoService.encrypt(
        updateEmployeeDto.residentRegistrationNumber,
      );
    }
    if (updateEmployeeDto.bankAccountNumber) {
      updateEmployeeDto.bankAccountNumber = this.cryptoService.encrypt(
        updateEmployeeDto.bankAccountNumber,
      );
    }

    const result = await this.employeesRepository.update(id, updateEmployeeDto);

    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.employeesRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }
  }
}
