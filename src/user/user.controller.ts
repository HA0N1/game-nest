import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, Req, Render } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { UpdatePWDto } from './dto/update-pw.dto';
import { AuthGuard } from '@nestjs/passport';

import { User } from './entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { InterestGenre } from './entities/interestGenre.entity';
import { Request, Response } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /* 회원 가입 */
  @Post('sign-up')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get('login')
  @Render('login.hbs')
  async login() {
    await this.userService.login();
  }

  /* 로그인 */
  @Post('email')
  async emailLogin(@Body() emailLoginDto: EmailLoginDto, @Res({ passthrough: true }) response: Response) {
    const login = await this.userService.emailLogin(emailLoginDto);

    const user = await this.userService.findUserByEmail(emailLoginDto.email);

    response.cookie('authorization', login.accessToken, { domain: 'localhost', maxAge: 3600000, httpOnly: true });
    return { message: login.message, accessToken: login.accessToken };
  }

  // 로그인했는지 안했는지 확인하기
  @Get('checkLogin')
  async checkLogin(@Req() req: Request) {
    const check = await this.userService.checkLogin(req.cookies);

    if (check) {
      return { isLoggedIn: true };
    } else {
      return { isLoggedIn: false };
    }
  }

  //TODO 토큰 관리 꼭 작성하기
  /* refreshtoken으로 accesstoken 재발급하기 */

  /* 프로필 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('userinfo')
  async findOne(@UserInfo() user: User) {
    const interestGenres = await this.userService.findInterestGenres(user);
    return { id: user.id, email: user.email, nickname: user.nickname, interestGenres };
  }

  /* 닉네임 수정 */
  @UseGuards(AuthGuard('jwt'))
  @Patch('nickname')
  async updateNickname(@UserInfo() user: User, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateNN(user.id, updateUserDto);
  }

  /* 비밀번호 수정 */
  @UseGuards(AuthGuard('jwt'))
  @Patch('password')
  async updatePW(@UserInfo() user: User, @Body() updatePWDto: UpdatePWDto) {
    return await this.userService.updatePW(user.id, updatePWDto);
  }

  /* 관심 게임 장르 수정 */
  @UseGuards(AuthGuard('jwt'))
  @Patch('interest-genre')
  async updateInterestGenre(@UserInfo() user: User, @Body() InterestGenre: any) {
    const genresObject = Object.values(InterestGenre);
    const genres = genresObject.join();

    if (InterestGenre.interestGenre.length === 0) {
      // 기존의 관심 장르들 모두 삭제
      return await this.userService.removeAll(user.id);
    } else {
      // 겹치지 않은 기존의 관심 장르 삭제
      const removeInterestGenre = await this.userService.removeIG(user.id, genres);
      // 새 관심 장르 생성
      return await this.userService.addIG(user.id, removeInterestGenre);
    }
  }
  /* 로그아웃 */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@UserInfo() user: User) {
    const userId = user.id;

    return await this.userService.logout(userId);
  }

  /* 회원 탈퇴 */
  @UseGuards(AuthGuard('jwt'))
  @Delete('delete')
  async remove(@UserInfo() user: User, @Body() password: string) {
    const userId = user.id;
    return await this.userService.remove(userId, password);
  }
}
