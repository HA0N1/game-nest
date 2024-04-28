import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Req,
  Render,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { ResizeImagePipe } from 'src/utils/resizeImage.pipe';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /* 회원 가입 */
  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Get('sign-up')
  @Render('signUp.hbs')
  async goToCreate() {
    await this.userService.signUp();
  }

  @Get('login')
  @Render('login.hbs')
  async login() {
    await this.userService.login();
  }

  /* 이메일 중복 확인 */
  @Post('checkEmail')
  async checkEmail(@Body() emailObject: Object) {
    const email = Object.values(emailObject)[0];

    const check = await this.userService.checkEmail(email);

    if (check) {
      return { isExist: true };
    } else {
      return { isExist: false };
    }
  }

  /* 로그인 */
  @Post('email')
  async emailLogin(@Body() emailLoginDto: EmailLoginDto, @Res({ passthrough: true }) response: Response) {
    const login = await this.userService.emailLogin(emailLoginDto);

    response.cookie('authorization', login.accessToken, {
      domain: 'chunsik.store',
      maxAge: 3600000,
      httpOnly: true,
    });
    response.cookie('Refresh', login.refreshToken, { httpOnly: true });
    return { message: login.message, accessToken: login.accessToken, refreshToken: login.refreshToken };
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

  /* refreshtoken으로 accesstoken 재발급하기 */
  @UseGuards(AuthGuard('refresh'))
  @Post('refreshToken')
  async newToken(@UserInfo() user: User, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    console.log('유저 컨트롤러: ', req);

    const refreshToken = req.cookies.Refresh;
    const email = user.email;

    const tokens = await this.userService.newAccessToken(email, refreshToken);

    res.cookie('authorization', tokens.accessToken, { httpOnly: true });
    res.cookie('Refresh', tokens.refreshToken, { httpOnly: true });

    return tokens;
  }

  /* 프로필 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('userinfo')
  async findOne(@UserInfo() user: User) {
    const userInfo = await this.userService.findUser(user);

    const interestGenre = await this.userService.findInterestGenres(user);

    const genreNames = interestGenre.map(ig => {
      return ig.genre_game_genre;
    });

    return {
      id: userInfo.id,
      email: userInfo.email,
      nickname: userInfo.nickname,
      file: userInfo.file.filePath,
      interestGenre: genreNames,
    };
  }

  /* 프로필 이미지 추가 */
  @UseInterceptors(FileInterceptor('filePath'))
  @UseGuards(AuthGuard('jwt'))
  @Patch('image')
  async addImage(@UserInfo() user: User, @UploadedFile(new ResizeImagePipe()) file: Express.Multer.File) {
    return this.userService.addImage(user, file);
  }

  /* 프로필 이미지 기본으로 변경 */
  @UseInterceptors(FileInterceptor('filePath'))
  @UseGuards(AuthGuard('jwt'))
  @Patch('defaultImage')
  async defaultImage(@UserInfo() user: User) {
    return this.userService.defaultImage(user);
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
  async logout(@UserInfo() user: User, @Res({ passthrough: true }) res: Response) {
    const userId = user.id;

    res.cookie('authorization', '', { maxAge: 0 });
    res.cookie('Refresh', '', { maxAge: 0 });
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
