import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/entities/user.entity';
import { UserInfo } from 'src/utils/decorators/userInfo';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  Render,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DMService } from './dm.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResizeImagePipe } from 'src/utils/resizeImage.pipe';

@Controller('dm')
export class DMController {
  constructor(private readonly dmService: DMService) {}

  @Get()
  @Render('dm')
  getDMPage() {}

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

  @UseInterceptors(FileInterceptor('filePath'))
  @UseGuards(AuthGuard('jwt'))
  @Post('file')
  async sendFile(
    @UserInfo() user: User,
    @UploadedFile(new ResizeImagePipe()) file: Express.Multer.File,
    @Query('dmRoomId') dmRoomId: number,
  ) {
    return this.dmService.sendFile(dmRoomId, user.id, file);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history/:dmroomId')
  async textHistory(@Param('dmroomId') dmroomId: number, @Query('page') page: number = 1) {
    return await this.dmService.textHistory(dmroomId);
  }
}
