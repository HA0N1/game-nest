import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PostComment } from './entities/comment.entity';
import { Post } from 'src/post/entities/post.entity';

@Injectable()
export class CommentService {
  @InjectRepository(PostComment)
  private commentRepository: Repository<PostComment>;

  @InjectRepository(Post)
  private postRepository: Repository<Post>;

  async create(userId: number, post_Id: number, createCommentDto: CreateCommentDto) {
    const { content } = createCommentDto;
    if (!content) {
      throw new BadRequestException('내용을 입력해주세요.');
    }
    const post = await this.postRepository.findOne({ where: { id: +post_Id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    const comment = await this.commentRepository.save({
      content,
      post,
      user: { id: userId },
    });

    return { message: '댓글이 생성되었습니다.', comment };
  }

  async findAll(post_Id: number) {
    const comments = await this.commentRepository.find({
      order: { id: 'DESC' },
      where: { post: { id: +post_Id } },
      relations: ['post', 'user'],
    });
    if (!comments) {
      throw new NotFoundException('댓글이 존재하지 않습니다.');
    }
    return comments;
  }

  async findOne(post_Id: number, id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id, post: { id: +post_Id } },
      relations: ['post', 'user'],
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    return comment;
  }

  async update(userId: number, post_Id: number, id: number, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentRepository.findOne({
      where: { id, post: { id: +post_Id } },
      relations: ['user'],
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    if (comment.user.id !== userId) {
      throw new UnauthorizedException('댓글을 수정할 수 있는 권한이 없습니다.');
    }
    const { content } = updateCommentDto;
    comment.content = content;
    const updatecomment = await this.commentRepository.save(comment);
    return { message: '댓글이 수정되었습니다.', updatecomment };
  }

  async remove(userId: number, post_Id: number, id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id, post: { id: +post_Id } },
      relations: ['user'],
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    if (comment.user.id !== userId) {
      throw new UnauthorizedException('댓글을 삭제할 수 있는 권한이 없습니다.');
    }
    const deletecomment = await this.commentRepository.remove(comment);
    return { message: '댓글이 삭제되었습니다.', deletecomment };
  }
}
