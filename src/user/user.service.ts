import { Injectable, ConflictException,UnauthorizedException, NotFoundException, } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { JwtService } from '@nestjs/jwt';
import _ from 'lodash';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 중복되는 이메일 있는지 확인
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('이미 해당 이메일로 가입한 사용자가 있습니다.');
    }

    // 입력한 장르를 장르 type에서 가져와 아이디로 등록하기

    
    // DB에 회원가입 정보 넣기
    const hashedPassword = await hash(createUserDto.password, 10);
    await this.userRepository.save({
      email: createUserDto.email,
      nickname: createUserDto.nickname,
      password: hashedPassword,
      interestGenre: 
    });

    return { message: `${createUserDto.nickname}님의 가입이 완료되었습니다.` };
  }

  async emailLogin(emailLoginDto: EmailLoginDto) {
    const user = await this.userRepository.findOne({
      select: ['id', 'email', 'password'],
      where: { email: emailLoginDto.email },
    });

    const email = emailLoginDto.email;
    const password = emailLoginDto.password

    if (_.isNil(user)) {
      throw new UnauthorizedException('이메일을 확인해주세요.');
    }
    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    const payload = { email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };

  }

  async findByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
