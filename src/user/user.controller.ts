import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { UpdatePWDto } from './dto/update-pw.dto';
import { AuthGuard } from '@nestjs/passport';

import { User } from './entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { InterestGenre } from './entities/interestGenre.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /* 회원 가입 */
  @Post('sign-up')
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  /* 로그인 */
  @Post('email')
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    const login = await this.userService.emailLogin(emailLoginDto);

    const user = await this.userService.findUserByEmail(emailLoginDto.email);

    const userId = user.id.toString();

    return { message: login.message, accessToken: login.accessToken };
  }

  /* 프로필 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('userinfo')
  async findOne(@UserInfo() user: User) {
    return { id: user.id, email: user.email, nickname: user.nickname };
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
    return await this.userService.updateIG(user.id, InterestGenre);
  }

  /* 회원 탈퇴 */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }

  // 프로필 이미지 업로드
  // @UseGuards(AuthGuard('jwt'))
  // @UseInterceptors(FileInterceptor('profileImage'))
  // @Post('upload-profile-image')
  // async uploadProfileImage(@UserInfo() user: User, @UploadedFile() file: Express.Multer.File) {
  //   return await this.userService.uploadProfileImage(user.id, file);
  // }
}
