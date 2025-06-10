import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { PayrollsService } from './payrolls.service';
import { Payroll } from './entities/payroll.entity';
import { Salary } from './entities/salary.entity';
import { Employee } from '../employees/entities/employee.entity';
import { UpsertSalaryDto } from './dto/upsert-salary.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

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

describe('PayrollsService', () => {
  let service: PayrollsService;
  let payrollRepository: MockRepository<Payroll>;
  let salaryRepository: MockRepository<Salary>;
  let employeeRepository: MockRepository<Employee>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollsService,
        {
          provide: getRepositoryToken(Payroll),
          useValue: createMockRepository<Payroll>(),
        },
        {
          provide: getRepositoryToken(Salary),
          useValue: createMockRepository<Salary>(),
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: createMockRepository<Employee>(),
        },
      ],
    }).compile();

    service = module.get<PayrollsService>(PayrollsService);
    payrollRepository = module.get(getRepositoryToken(Payroll));
    salaryRepository = module.get(getRepositoryToken(Salary));
    employeeRepository = module.get(getRepositoryToken(Employee));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertSalary', () => {
    const employeeId = 'employee-id-1';
    const upsertSalaryDto: UpsertSalaryDto = {
      baseSalary: 5000000,
      effectiveDate: '2024-01-01',
    };

    it('should create a new salary record', async () => {
      employeeRepository.findOne!.mockResolvedValue({
        id: employeeId,
      } as Employee);
      salaryRepository.findOne!.mockResolvedValue(null);
      salaryRepository.create!.mockImplementation((dto) => dto as any);
      salaryRepository.save!.mockImplementation((sal) =>
        Promise.resolve({ ...sal, id: 'salary-id-1' }),
      );

      const result = await service.upsertSalary(employeeId, upsertSalaryDto);

      expect(salaryRepository.create).toHaveBeenCalledWith({
        employeeId,
        ...upsertSalaryDto,
      });
      expect(result).toHaveProperty('id', 'salary-id-1');
    });

    it('should update an existing salary record', async () => {
      const existingSalary = {
        id: 'salary-id-1',
        employeeId,
        baseSalary: 4500000,
        effectiveDate: '2023-01-01',
      } as Salary;
      employeeRepository.findOne!.mockResolvedValue({
        id: employeeId,
      } as Employee);
      salaryRepository.findOne!.mockResolvedValue(existingSalary);
      salaryRepository.save!.mockImplementation((sal) => Promise.resolve(sal));

      const result = await service.upsertSalary(employeeId, upsertSalaryDto);

      expect(result.baseSalary).toBe(5000000);
      expect(result.effectiveDate).toBe('2024-01-01');
    });

    it('should throw NotFoundException if employee not found', async () => {
      employeeRepository.findOne!.mockResolvedValue(null);
      await expect(
        service.upsertSalary(employeeId, upsertSalaryDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generatePayrolls', () => {
    const generatePayrollDto: GeneratePayrollDto = { year: 2024, month: 1 };

    it('should generate payrolls for all active employees with salary info', async () => {
      const mockEmployees = [
        { id: 'emp-1', name: 'Alice', salary: { baseSalary: 5000000 } },
        { id: 'emp-2', name: 'Bob', salary: { baseSalary: 6000000 } },
        { id: 'emp-3', name: 'Charlie', salary: null }, // No salary info
      ] as Employee[];

      payrollRepository.findOne!.mockResolvedValue(null);
      employeeRepository.find!.mockResolvedValue(mockEmployees);
      payrollRepository.create!.mockImplementation((p) => p);

      const result = await service.generatePayrolls(generatePayrollDto);

      expect(payrollRepository.findOne).toHaveBeenCalled();
      expect(employeeRepository.find).toHaveBeenCalled();
      expect(payrollRepository.create).toHaveBeenCalledTimes(2); // Alice and Bob
      expect(payrollRepository.save).toHaveBeenCalledWith(expect.any(Array));
      expect(result.count).toBe(2);
    });

    it('should throw ConflictException if payrolls for the month already exist', async () => {
      payrollRepository.findOne!.mockResolvedValue({
        id: 'existing-payroll',
      } as Payroll);

      await expect(
        service.generatePayrolls(generatePayrollDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
