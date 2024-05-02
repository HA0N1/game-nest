import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { User } from 'src/user/entities/user.entity';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  //댓글 작성
  @UseGuards(AuthGuard('jwt'))
  @Post(':postId')
  create(@UserInfo() user: User, @Param('postId') postId: number, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(user.id, postId, createCommentDto);
  }

  //댓글 조회
  @Get(':postId')
  findAll(@Param('postId') postId: number) {
    return this.commentService.findAll(postId);
  }

  //댓글 상세 조회
  @Get(':postId/:commentId')
  findOne(@Param('postId') postId: number, @Param('commentId') id: number) {
    return this.commentService.findOne(postId, +id);
  }

  //댓글 수정
  @UseGuards(AuthGuard('jwt'))
  @Patch(':postId/:commentId')
  update(
    @UserInfo() user: User,
    @Param('postId') post_Id: number,
    @Param('commentId') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(user.id, post_Id, +id, updateCommentDto);
  }

  //댓글 삭제
  @UseGuards(AuthGuard('jwt'))
  @Delete(':postId/:commentId')
  remove(@UserInfo() user: User, @Param('postId') post_Id: number, @Param('commentId') id: string) {
    return this.commentService.remove(user.id, post_Id, +id);
  }

  //댓글 갯수
  @Get(':postId/commentCount')
  getCommentCount(@Param('postId') postId: number) {
    return this.commentService.countComments(postId);
  }
}
