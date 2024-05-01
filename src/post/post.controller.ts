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
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Category } from './entities/type/post.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UserInfo } from 'src/utils/decorators/userInfo';
import { User } from 'src/user/entities/user.entity';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // 게시글 작성
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard('refresh'))
  @Post()
  async create(
    @UserInfo() user: User,
    @Res({ passthrough: true }) res: Response,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.postService.create(user.id, createPostDto, file);
    return result;
  }

  // 게시글 전체 조회
  @Get()
  async findAll(userId: number) {
    const posts = await this.postService.findAll(userId);
    return posts;
  }

  //프론트엔드 전체 조회
  @Get('/page')
  @Render('post.hbs')
  async page() {}

  // 게시글 카테고리별 조회
  @Get('category/:category')
  findCategory(@Param('category') category: Category) {
    return this.postService.findCategory(category);
  }

  // 게시글 상세 조회
  @Get(':postId')
  findOne(@Param('postId') id: number) {
    return this.postService.findOne(id);
  }
  //프론트엔드 상세 조회
  @Get(':postId/page')
  @Render('postDetail.hbs')
  async detailpage() {}

  // 게시글 수정
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard('jwt'))
  @Patch(':postId')
  async update(
    @UserInfo() user: User,
    @Res({ passthrough: true }) res: Response,
    @Param('postId') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.postService.update(user.id, +id, updatePostDto, file);
    return result;
  }

  // 게시글 삭제
  @UseGuards(AuthGuard('jwt'))
  @Delete(':postId')
  async remove(@UserInfo() user: User, @Res({ passthrough: true }) res: Response, @Param('postId') id: string) {
    const result = await this.postService.remove(user.id, +id);
    return result;
  }

  //게시글 좋아요
  @UseGuards(AuthGuard('jwt'))
  @Post(':postId/like')
  async likePost(@UserInfo() user: User, @Res({ passthrough: true }) res: Response, @Param('postId') id: number) {
    const result = await this.postService.likePost(user.id, id);
    return result;
  }

  //게시글 좋아요 취소
  @UseGuards(AuthGuard('jwt'))
  @Delete(':postId/like')
  async unlikePost(@UserInfo() user: User, @Res({ passthrough: true }) res: Response, @Param('postId') id: number) {
    const result = await this.postService.unlikePost(user.id, id);
    return result;
  }

  //게시글 좋아요 확인
  @UseGuards(AuthGuard('jwt'))
  @Get(':postId/liked')
  async isLikedByUser(@UserInfo() user: User, @Param('postId') id: number) {
    const liked = await this.postService.isLikedByUser(user.id, id);
    return { liked };
  }
}
