import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  //댓글 작성
  @Post(':post_Id')
  create(@Param('post_Id') post_Id: number, @Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(post_Id, createCommentDto);
  }

  //댓글 조회
  @Get('')
  findAll() {
    return this.commentService.findAll();
  }

  //댓글 상세 조회
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.commentService.findOne(+id);
  }

  //댓글 수정
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentService.update(+id, updateCommentDto);
  }

  //댓글 삭제
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentService.remove(+id);
  }
}
