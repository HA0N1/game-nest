import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { JwtService } from '@nestjs/jwt';
import _ from 'lodash';
import { compare, hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InterestGenre } from './entities/interestGenre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisCache } from 'cache-store-manager/redis';
import redisCache from 'src/redis/config';
import { Genre } from 'src/game/entities/gameGenre.entity';
import { UpdatePWDto } from './dto/update-pw.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(InterestGenre)
    private interestGenreRepository: Repository<InterestGenre>,
    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
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

    if (createUserDto.password !== createUserDto.passwordCheck) {
      throw new BadRequestException('비밀번호와 비밀번호 확인이 다릅니다.');
    }

    const interestGenre = createUserDto.interestGenre; // 희망하는 장르의 아이디들을 배열로 받아옴 [1(action), 3(RolePlaying), 5(Adventure)]

    // DB에 회원가입 정보 넣기
    const hashedPassword = await hash(createUserDto.password, 10);
    const user = await this.userRepository.save({
      email: createUserDto.email,
      nickname: createUserDto.nickname,
      password: hashedPassword,
    });

    // interestGenre 하나씩 생성하기
    await interestGenre.map(async element => {
      // 장르 아이디로 장르 테이블 가져오기
      const inputGenre = await this.findGenre(+element);
      if (!inputGenre) {
        throw new NotFoundException('해당 아이디의 장르는 없습니다.');
      }
      // 위의 error로 존재하지 않은 아이디(10 이상의 숫자 아이디)를 가진 interestGenre는 생성되지 않음

      return await this.interestGenreRepository.save({
        user,
        genre: inputGenre,
      });
    });

    return { message: `${createUserDto.nickname}님의 가입이 완료되었습니다.` };
  }

  // 장르 아이디로 장르 받아오는 함수
  private async findGenre(id: number) {
    return await this.genreRepository.findOne({ where: { id } });
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

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await redisCache.set(`REFRESH_TOKEN:${user.id}`, refreshToken);

    return { message: `${user.nickname}님 로그인 완료!`, accessToken, refreshToken };
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

  /* 닉네임 수정 */
  async updateNN(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    await this.userRepository.update({ id }, { nickname: updateUserDto.nickname });

    return { message: `${updateUserDto.nickname}으로 닉네임 변경 완료` };
  }

  /* 비밀번호 수정 */
  async updatePW(id: number, updatePWDTO: UpdatePWDto) {
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    if (updatePWDTO.newPassword !== updatePWDTO.passwordCheck) {
      throw new BadRequestException('비밀번호와 비밀번호 확인이 다릅니다.');
    }

    if (!(await compare(updatePWDTO.originPassword, user.password))) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    const hashedPassword = await hash(updatePWDTO.newPassword, 10);

    await this.userRepository.update(
      { id },
      {
        password: hashedPassword,
      },
    );

    return { message: '비밀번호 수정 완료' };
  }

  /* 관심 장르 수정 */
  async updateIG(id: number, interestGenre: any) {}

  /* 유저 탈퇴 */
  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
