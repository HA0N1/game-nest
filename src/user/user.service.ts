import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { JwtService } from '@nestjs/jwt';
import _ from 'lodash';
import { compare, hash } from 'bcrypt';
import { Repository, Brackets } from 'typeorm';
import { User } from './entities/user.entity';
import { InterestGenre } from './entities/interestGenre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisCache } from 'cache-store-manager/redis';
// import redisClient from 'src/redis/config';
import { Genre } from 'src/game/entities/game-genre.entity';
import { UpdatePWDto } from './dto/update-pw.dto';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpService } from '@nestjs/axios';
import { Observable, firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(InterestGenre)
    private interestGenreRepository: Repository<InterestGenre>,
    private readonly httpService: HttpService,
    private readonly awsService: AwsService,
    @InjectRepository(File) private fileRepository: Repository<File>,
    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async signUp() {
    return this.httpService.post('http://localhost:3000/user/create');
  }

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

    // 기본 프로필 이미지 불러오기
    const imageUrl = process.env.DEFAULT_PROFILE_IMAGE;

    const image = await this.fileRepository.findOneBy({ filePath: imageUrl });

    // DB에 회원가입 정보 넣기
    const hashedPassword = await hash(createUserDto.password, 10);
    const user = await this.userRepository.save({
      email: createUserDto.email,
      nickname: createUserDto.nickname,
      password: hashedPassword,
      file: image,
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

  /* 이메일 중복 확인하기 */
  async checkEmail(email: string) {
    const existingUser = await this.userRepository.findOneBy({
      email,
    });

    if (existingUser) {
      return true;
    } else {
      return false;
    }
  }

  async login() {
    return this.httpService.post('http://localhost:3000/user/email');
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

    const hashedRefreshToken = await hash(refreshToken, 10);

    await this.redis.setex(`REFRESH_TOKEN:${user.id}`, 604800, hashedRefreshToken);

    return { message: `${user.nickname}님 로그인 완료!`, accessToken, refreshToken };
  }

  // refreshToken으로 accessToken, refreshToken 재발급 받기
  async newAccessToken(email: string, refreshToken: string) {
    const user = await this.findUserByEmail(email);

    const getRefreshToken = await this.redis.get(`REFRESH_TOKEN:${user.id}`);

    if (!getRefreshToken) {
      throw new NotFoundException(401, '로그인 내역이 없습니다. 로그인 내역을 확인해주세요.');
    }

    if (!(await compare(refreshToken, getRefreshToken))) {
      throw new UnauthorizedException('RefreshToken이 다릅니다. 본인 확인이 필요합니다.');
    }

    const payload = { email, sub: user.id };

    const newAccessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashedNewRefreshToken = await hash(newRefreshToken, 10);
    await this.redis.setex(`REFRESH_TOKEN:${user.id}`, 604800, hashedNewRefreshToken);

    return {
      message: `${user.nickname} accessToken 재발급 완료!`,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async checkLogin(cookies) {
    const key = Object.keys(cookies);

    if (key[0] === 'authorization') {
      return true;
    } else {
      return false;
    }
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

  /* 프로필 조회 */
  async findUser(user: User) {
    const returnUser = await this.userRepository
      .createQueryBuilder('us')
      .leftJoin('us.file', 'fi')
      .select(['us.id', 'us.email', 'us.nickname', 'fi.id', 'fi.filePath'])
      .where('us.id=:id', { id: user.id })
      .getOne();

    return returnUser;
  }

  async findInterestGenres(user: User) {
    return await this.interestGenreRepository
      .createQueryBuilder('ig')
      .leftJoinAndSelect('ig.genre', 'genre')
      .select(['genre.id', 'genre.gameGenre'])
      .where('ig.user_id = :user_id', { user_id: user.id })
      .getRawMany();
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

    if (!updatePWDTO.originPassword || !updatePWDTO.newPassword || !updatePWDTO.passwordCheck) {
      throw new BadRequestException('body에 originPassword, newPassword, passwordCheck을 올바르게 입력하세요');
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

  /* 관심 장르 전체 삭제 */
  async removeAll(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    // 유저 정보로 관심장르 모두 삭제
    await this.interestGenreRepository
      .createQueryBuilder()
      .softDelete()
      .where('user_id = :user_id', { user_id: id })
      .execute();

    return { message: '관심있는 게임 장르를 삭제하였습니다.' };
  }

  /* 안 겹치는 관심 장르만 삭제 */
  async removeIG(id: number, interestGenre: string) {
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    //해당 유저 아이디의 interestGenre soft delete 전체 해제
    await this.interestGenreRepository
      .createQueryBuilder()
      .restore()
      .where('user_id = :user_id', { user_id: id })
      .execute();

    // 유저 아이디로 interestGenre 조회 후 장르 아이디들 추출
    const originInterestGenres = await this.interestGenreRepository
      .createQueryBuilder('ig')
      .select()
      .leftJoinAndSelect('ig.user', 'u')
      .leftJoinAndSelect('ig.genre', 'g')
      .where('ig.user_id = :user_id', { user_id: id })
      .getMany();

    const originIds = originInterestGenres.map(ig => {
      return ig.genre.id;
    });

    console.log('originIds: ', originIds);

    const newIdsSplit = interestGenre.split(',');
    const newIds = newIdsSplit.map(id => {
      return parseInt(id);
    });
    console.log('newIds: ', newIds);

    // 회원 가입 시 기존 관심 장르를 아무것도 하지 않았을 때 새롭게 생성하기로 바로 보냄
    if (originInterestGenres.length === 0) {
      return newIds;
    }

    // 기존 interestGenre에 있던 장르 아이디들: originIds
    // 새로 입력한 장르 아이디들: newIds

    // originIds를 기준으로 map 돌림
    // newIds에 없는 id => delete_at에 지금 날짜 찍음 (softdelete 진행)
    // newIds에 있는 id => 냅둠, newIds에 해당 아이디 지우고 addInterestGenre에 넘겨주기
    else {
      // 새 장르의 아이디가 이미 있고 삭제된 상태면 복구, 일치하지 않으면 삭제
      originIds.map(async oId => {
        if (!newIds.includes(oId)) {
          // newIds에 없는 id => delete_at에 지금 날짜 찍음 (soft delete)
          await this.interestGenreRepository
            .createQueryBuilder()
            .softDelete()
            .where('user_id = :user_id', { user_id: id })
            .andWhere('genre_id = :genre_id', { genre_id: oId })
            .execute();
        } else {
          const indexOfoId = newIds.indexOf(oId);
          newIds.splice(indexOfoId, 1);
        }
      });

      return newIds;
    }
  }

  /* 새 관심 장르 추가 */
  async addIG(id: number, newIds: Array<number>) {
    const user = await this.userRepository.findOneBy({ id });

    newIds.map(async id => {
      const genre = await this.findGenre(id);

      return await this.interestGenreRepository.save({ user, genre });
    });

    return { message: '관심 장르 수정이 완료되었습니다.' };
  }

  /* 로그아웃 */
  async logout(id: number) {
    const getRefreshToken = await this.redis.get(`REFRESH_TOKEN:${id}`);

    if (!getRefreshToken) {
      throw new NotFoundException(401, '로그인 내역이 없습니다. 로그인 내역을 확인해주세요.');
    }

    await this.redis.del(`REFRESH_TOKEN:${id}`);

    return { message: '로그아웃 완료' };
  }

  /* 유저 탈퇴 */
  async remove(id: number, password: string) {
    const pw = Object.values(password);
    const stringPw = pw.toString();

    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!(await compare(stringPw, user.password))) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    await this.userRepository.delete({ id });

    await this.redis.del(`REFRESH_TOKEN:${id}`);

    return { message: '유저 탈퇴에 성공했습니다.' };
  }

  /* 장르 아이디로 장르 받아오는 함수 */
  private async findGenre(id: number) {
    return await this.genreRepository.findOne({ where: { id } });
  }

  /* 프로필 이미지 수정 */
  async addImage(user: User, file: Express.Multer.File) {
    const imagename = this.awsService.getUUID();

    const ext = file.originalname.split('.').pop();

    const fileName = `${imagename}.${ext}`;

    const imageUrl = `https://s3.${process.env.AWS_S3_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`;

    const userId = user.id;

    const newImageUrl = await this.awsService.imageUploadToS3(fileName, file, ext);

    const filePath = await this.fileRepository.save({ filePath: newImageUrl });
    await this.userRepository.update({ id: userId }, { file: filePath });

    return { message: '프로필 이미지 수정 완료' };
  }

  async defaultImage(user: User) {
    const imageUrl = process.env.DEFAULT_PROFILE_IMAGE;

    const image = await this.fileRepository.findOneBy({ filePath: imageUrl });

    await this.userRepository.update({ id: user.id }, { file: image });

    return { message: '기본 이미지로 변경 완료' };
  }
}
