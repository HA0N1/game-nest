import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GameCommentService } from './game-comment.service';
import { UpdateGameCommentDto } from '../dto/update-game-comment.dto';
import { CreateGameCommentDto } from '../dto/create-game-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { User } from 'src/user/entities/user.entity';

@Controller('games')
export class GameCommentController {
  constructor(private readonly gameCommentService: GameCommentService) {}

  //댓글 작성
  @UseGuards(AuthGuard('jwt'))
  @Post('/:gameId/comment')
  createComment(
    @Param('gameId') gameId: number,
    @UserInfo() user: User,
    @Body() createGameCommentDto: CreateGameCommentDto,
  ) {
    return this.gameCommentService.createComment(gameId, user.id, createGameCommentDto);
  }

  // 댓글 전체 조회
  @Get('/:gameId/comment')
  getAllComments(@Param('gameId') gameId: number) {
    return this.gameCommentService.getAllComments(gameId);
  }

  //댓글 수정
  @UseGuards(AuthGuard('jwt'))
  @Patch('/:gameId/comment/:commentId')
  updateComment(
    @Param('commentId') commentId: number,
    @Param('gameId') gameId: number,
    @UserInfo() user: User,
    @Body() updateGameCommentDto: UpdateGameCommentDto,
  ) {
    return this.gameCommentService.updateComment(commentId, user.id, gameId, updateGameCommentDto);
  }

  // //댓글 삭제
  @UseGuards(AuthGuard('jwt'))
  @Delete('/:gameId/comment/:commentId')
  deleteComment(@Param('commentId') commentId: number, @Param('gameId') gameId: number, @UserInfo() user: User) {
    return this.gameCommentService.deleteComment(commentId, gameId, user.id);
  }
}
