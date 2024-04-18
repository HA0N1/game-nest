import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Render,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Category } from './entities/type/post.type';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // 게시글 작성
  @UseInterceptors(FileInterceptor('filePath'))
  @Post()
  create(@Body() createPostDto: CreatePostDto, @UploadedFile() file: Express.Multer.File) {
    return this.postService.create(createPostDto, file);
  }

  // 게시글 전체 조회
  @Get()
  @Render('post')
  findAll() {
    return this.postService.findAll();
  }

  // 게시글 카테고리별 조회
  @Get('category/:category')
  findCategory(@Param('category') category: Category) {
    return this.postService.findCategory(category);
  }

  // 게시글 상세 조회
  @Get(':postId')
  findOne(@Param('postId') id: string) {
    return this.postService.findOne(+id);
  }

  // 게시글 수정
  @UseInterceptors(FileInterceptor('filePath'))
  @Patch(':postId')
  update(@Param('postId') id: string, @Body() updatePostDto: UpdatePostDto, @UploadedFile() file: Express.Multer.File) {
    return this.postService.update(+id, updatePostDto, file);
  }

  // 게시글 삭제
  @Delete(':postId')
  remove(@Param('postId') id: string) {
    return this.postService.remove(+id);
  }

  //게시글 좋아요
  @Post(':postId/like')
  async likePost(@Param('postId') id: number) {
    return this.postService.likePost(id);
  }

  //게시글 좋아요 삭제
  @Delete(':postId/like')
  async unlikePost(@Param('postId') id: number) {
    return this.postService.unlikePost(id);
  }
}
