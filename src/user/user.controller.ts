import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';

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

  /* 프로필 수정 */
  @UseGuards(AuthGuard('jwt'))
  @Patch('userinfo')
  async update(@UserInfo() user: User, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(user.id, updateUserDto);
  }

  /* 회원 탈퇴 */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }
}
