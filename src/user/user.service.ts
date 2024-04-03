import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { JwtService } from '@nestjs/jwt';
import _ from 'lodash';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InterestGenre } from '../user/entities/interestGenre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisRepository } from 'auth/redis/redis.repository';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(InterestGenre)
    private interestGenreRepository: Repository<InterestGenre>,
  ) {}

  /* 회원가입 */
  async create(createUserDto: CreateUserDto) {
    // 중복되는 이메일 있는지 확인
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('이미 해당 이메일로 가입한 사용자가 있습니다.');
    }

    // DB에 회원가입 정보 넣기
    const hashedPassword = await hash(createUserDto.password, 10);
    const user = await this.userRepository.save({
      email: createUserDto.email,
      nickname: createUserDto.nickname,
      password: hashedPassword,
    });

    const interestGenre = createUserDto.interestGenre; // 희망하는 장르의 아이디들을 배열로 받아옴 [1(action), 3(RolePlaying), 5(Adventure)]

    // interestGenre 하나씩 생성하기
    interestGenre.map(element => {
      return this.interestGenreRepository.save({
        user,
        genre_id: +element,
      });
    });

    return { message: `${createUserDto.nickname}님의 가입이 완료되었습니다.` };
  }

  /* 이메일로 로그인 */
  async emailLogin(emailLoginDto: EmailLoginDto) {
    const user = await this.userRepository.findOne({
      select: ['id', 'email', 'password', 'nickname'],
      where: { email: emailLoginDto.email },
    });

    const email = emailLoginDto.email;
    const password = emailLoginDto.password;

    if (_.isNil(user)) {
      throw new UnauthorizedException('이메일을 확인해주세요.');
    }
    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    const payload = { email, sub: user.id };

    // const userId = user.id.toString();

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { message: `${user.nickname}님 로그인 완료!`, accessToken };
  }

  /* 유저 조회 */
  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });
    return user;
  }

  async findUserById(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    return user;
  }

  /* 프로필 수정 */
  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  /* 유저 탈퇴 */
  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
