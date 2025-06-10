import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../domains/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domains/users/entities/user.entity';
import { UserRole } from '../../domains/users/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password when validation is successful', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user: User = {
        id: 'user-id-1',
        email,
        password: 'hashedPassword',
        role: UserRole.STAFF,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        user.password,
      );

      const { password: _, ...userWithoutPassword } = user;
      expect(result).toEqual(userWithoutPassword);
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      const result = await service.validateUser(
        'nonexistent@user.com',
        'password',
      );
      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      const user: User = {
        id: 'user-id-1',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: UserRole.STAFF,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockUsersService.findOneByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token', () => {
      const user: Omit<User, 'password'> = {
        id: 'user-id-1',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      const token = 'test-access-token';
      mockJwtService.sign.mockReturnValue(token);

      const result = service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
      });
      expect(result).toEqual({ access_token: token });
    });
  });
});
