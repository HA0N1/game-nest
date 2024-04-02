import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/type/post.type';

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
    return { message: '게시글이 생성되었습니다.', post };
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
  async findCategory(category: Category) {
    const post = await this.postRepository.find({ where: { category } });
    if (!post) {
      throw new NotFoundException('해당 카테고리의 게시글을 찾을 수 없습니다.');
    }
    return post;
  }

  //게시글 상세 조회
  async findOne(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    post.view_count++;
    await this.postRepository.save(post);

    return post;
  }

  //게시글 수정
  async update(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    const { title, content, category } = updatePostDto;
    (post.title = title), (post.content = content), (post.category = category);

    const updatePost = await this.postRepository.save(post);

    return { message: '게시글이 수정되었습니다.', updatePost };
  }

  //게시글 삭제
  async remove(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const deletePost = await this.postRepository.remove(post);
    return { message: '게시글이 삭제되었습니다', deletePost };
  }
}
