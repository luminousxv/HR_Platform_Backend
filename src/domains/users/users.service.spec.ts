import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './enums/user-role.enum';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Repository를 모의(mock)하기 위한 타입 정의
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

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.STAFF,
    };

    it('should create and return a user', async () => {
      const hashedPassword = 'hashedPassword';
      userRepository.findOne!.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const userToSave = { ...createUserDto, password: hashedPassword };
      userRepository.create!.mockReturnValue(userToSave);
      userRepository.save!.mockResolvedValue({
        ...userToSave,
        id: 'new-user-id',
      });

      const result = await service.create(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );
      expect(userRepository.create).toHaveBeenCalledWith(userToSave);
      expect(userRepository.save).toHaveBeenCalledWith(userToSave);
      expect(result).toHaveProperty('id', 'new-user-id');
    });

    it('should throw a ConflictException if user already exists', async () => {
      userRepository.findOne!.mockResolvedValue({ id: 'existing-id' } as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('이미 사용중인 이메일입니다.'),
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      const email = 'test@example.com';
      const user = { email } as User;
      userRepository.findOne!.mockResolvedValue(user);

      const result = await service.findOneByEmail(email);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const email = 'notfound@example.com';
      userRepository.findOne!.mockResolvedValue(null);

      const result = await service.findOneByEmail(email);

      expect(result).toBeNull();
    });
  });
});
