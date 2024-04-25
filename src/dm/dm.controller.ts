import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpStatus } from '@nestjs/common';
import { DMService } from './dm.service';

@Controller('dm')
export class DMController {
  constructor(private readonly dmService: DMService) {}

  /* 디엠 방 생성 */
  @UseGuards(AuthGuard('jwt'))
  @Post('create/:friendshipId')
  async createDM(@UserInfo() user: User, @Param('friendshipId') friendshipId: number) {
    if (!friendshipId) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'friendshipId를 작성하지 않았습니다.' };
    }
    return await this.dmService.createDMRoom(user.id, friendshipId);
  }

  /* 디엠 방 전체 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getDMRooms(@UserInfo() user: User) {
    return await this.dmService.getDMRooms(user.id);
  }

  /* 디엠 상세 조회 */
  @UseGuards(AuthGuard('jwt'))
  @Get('findDmRoom/:dmroomId')
  async findDMRoom(@UserInfo() user: User, @Param('dmroomId') dmroomId: number) {
    if (!dmroomId) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'dmroomId를 작성하지 않았습니다.' };
    }
    return await this.dmService.findDMRoom(user.id, dmroomId);
  }

  /* 디엠 방 삭제 */
  @UseGuards(AuthGuard('jwt'))
  @Delete('deleteDmRoom/:dmroomId')
  async deleteDmRoom(@UserInfo() user: User, @Param('dmroomId') dmroomId: number) {
    if (!dmroomId) {
      return { statusCode: HttpStatus.BAD_REQUEST, message: 'dmroomId를 작성하지 않았습니다.' };
    }

    return await this.dmService.deleteRoom(user.id, dmroomId);
  }
}
