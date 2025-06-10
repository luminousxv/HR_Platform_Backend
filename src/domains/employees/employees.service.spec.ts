import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { EmployeesService } from './employees.service';
import { UsersService } from '../users/users.service';
import { CryptoService } from '../../shared/services/crypto.service';
import { Employee } from './entities/employee.entity';
import { User } from '../users/entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '../users/enums/user-role.enum';
import { EmploymentType } from './enums/employment-type.enum';

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

describe('EmployeesService', () => {
  let service: EmployeesService;
  let employeeRepository: MockRepository<Employee>;
  let usersService: any;
  let cryptoService: Partial<CryptoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: getRepositoryToken(Employee),
          useValue: createMockRepository<Employee>(),
        },
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn().mockImplementation((val) => `encrypted_${val}`),
            decrypt: jest
              .fn()
              .mockImplementation((val) => val.replace('encrypted_', '')),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    employeeRepository = module.get<MockRepository<Employee>>(
      getRepositoryToken(Employee),
    );
    usersService = module.get(UsersService);
    cryptoService = module.get<Partial<CryptoService>>(CryptoService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    let createEmployeeDto: CreateEmployeeDto;
    let mockUser: User;

    beforeEach(() => {
      createEmployeeDto = {
        userId: 'user-id-1',
        name: 'John Doe',
        employeeNumber: 'EMP001',
        joinDate: '2023-01-01',
        residentRegistrationNumber: '900101-1234567',
        phoneNumber: '010-1234-5678',
        employmentType: EmploymentType.FULL_TIME,
        bankName: 'Test Bank',
        bankAccountNumber: '123-456-789',
        position: 'Developer',
        department: 'IT',
      };

      mockUser = {
        id: 'user-id-1',
        email: 'john.doe@example.com',
        role: UserRole.STAFF,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
    });

    it('should create an employee successfully', async () => {
      usersService.findOneById.mockResolvedValue(mockUser);
      employeeRepository.findOne!.mockResolvedValue(null);

      const encryptedRRN = `encrypted_${createEmployeeDto.residentRegistrationNumber}`;
      const encryptedBAN = `encrypted_${createEmployeeDto.bankAccountNumber}`;
      const employeeData = {
        ...createEmployeeDto,
        residentRegistrationNumber: encryptedRRN,
        bankAccountNumber: encryptedBAN,
        user: mockUser,
      };

      employeeRepository.create!.mockReturnValue(employeeData as any);
      employeeRepository.save!.mockResolvedValue({
        id: 'employee-id-1',
        ...employeeData,
      } as any);

      const result = await service.create(createEmployeeDto);

      expect(usersService.findOneById).toHaveBeenCalledWith(
        createEmployeeDto.userId,
      );
      expect(cryptoService.encrypt).toHaveBeenCalledWith(
        createEmployeeDto.residentRegistrationNumber,
      );
      expect(cryptoService.encrypt).toHaveBeenCalledWith(
        createEmployeeDto.bankAccountNumber,
      );
      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { userId: createEmployeeDto.userId },
      });
      expect(employeeRepository.create).toHaveBeenCalledWith(employeeData);
      expect(employeeRepository.save).toHaveBeenCalledWith(employeeData);
      expect(result).toHaveProperty('id', 'employee-id-1');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      usersService.findOneById.mockResolvedValue(null);

      await expect(service.create(createEmployeeDto)).rejects.toThrow(
        new NotFoundException(
          `User with ID "${createEmployeeDto.userId}" not found`,
        ),
      );
    });

    it('should throw ConflictException if employee already exists', async () => {
      usersService.findOneById.mockResolvedValue(mockUser);
      employeeRepository.findOne!.mockResolvedValue({
        id: 'existing-employee',
      } as Employee);

      await expect(service.create(createEmployeeDto)).rejects.toThrow(
        new ConflictException(
          `Employee for user ID "${createEmployeeDto.userId}" already exists`,
        ),
      );
    });
  });
});
