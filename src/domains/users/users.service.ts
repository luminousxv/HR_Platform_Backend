import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password } = createUserDto;

    // 이메일 중복 확인
    const existingUser = await this.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용중인 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const newUser = this.userRepository.create({
      ...createUserDto,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = savedUser;
    return result;
  }
}
