import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailLoginDto } from './dto/emailLogin.dto';
import { AuthGuard } from '@nestjs/passport';
import { RedisService } from 'auth/redis/redis.service';
import { User } from './entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  /* 회원 가입 */
  @Post('sign-up')
  async create(@Body() createUserDto: CreateUserDto) {
    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    return await this.userService.create(createUserDto);
  }

  /* 로그인 */
  @Post('email')
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    const login = await this.userService.emailLogin(emailLoginDto);

    const user = await this.userService.findUserByEmail(emailLoginDto.email);

    const userId = user.id.toString();

    // const registerRedis = await this.redisService.setValueToRedis(userId, login.refreshToken);

    return login;
  }

  /* 프로필 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('userinfo')
  async findOne(@UserInfo() user: User) {
    return { user };
  }

  /* 프로필 수정 */
  @Patch('userinfo')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.update(+id, updateUserDto);
  }

  /* 회원 탈퇴 */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(+id);
  }
}
