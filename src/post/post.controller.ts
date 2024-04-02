import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // 게시글 작성
  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  // 게시글 전체 조회
  @Get()
  findAll() {
    return this.postService.findAll();
  }

  // 게시글 카테고리별 조회
  @Get('category')
  findCategory(@Param('category') id: string) {
    return this.postService.findOne(+id);
  }

  // 게시글 상세 조회
  @Get(':postId')
  findOne(@Param('postId') id: string) {
    return this.postService.findOne(+id);
  }

  // 게시글 수정
  @Patch(':postId')
  update(@Param('postId') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  // 게시글 삭제
  @Delete(':postId')
  remove(@Param('postId') id: string) {
    return this.postService.remove(+id);
  }
}
