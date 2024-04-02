import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PostService {
  @InjectRepository(Post)
  private postRepository: Repository<Post>;
  //게시글 작성
  async create(createPostDto: CreatePostDto) {
    const { title, content, category } = createPostDto;
    if (!category) {
      throw new BadRequestException('카테고리를 입력해주세요.');
    }
    const post = await this.postRepository.save({
      title,
      content,
      category,
      view_count: 0,
    });
    return post;
  }

  //게시글 전체 조회
  async findAll() {
    const post = await this.postRepository.find();
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    return post;
  }

  //게시글 카테고리별 조회
  findCategory(id: number) {
    return `This action returns a #${id} post`;
  }

  //게시글 상세 조회
  async findOne(id: number) {
    return await this.findOne(id);
  }

  //게시글 수정
  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  //게시글 삭제
  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
