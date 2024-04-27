import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameComment } from '../entities/game-comment.entity';
import { Repository } from 'typeorm';
import { UpdateGameCommentDto } from '../dto/update-game-comment.dto';
import { CreateGameCommentDto } from '../dto/create-game-comment.dto';
import { Game } from '../entities/game.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class GameCommentService {
  @InjectRepository(GameComment)
  private readonly gameCommentRepository: Repository<GameComment>;

  @InjectRepository(Game)
  private readonly gameRepository: Repository<Game>;

  @InjectRepository(User)
  private readonly userRepository: Repository<User>;

  // 댓글 작성
  async createComment(gameId: number, userId: number, createGameCommentDto: CreateGameCommentDto) {
    const { content } = createGameCommentDto;
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('해당 게임을 찾을 수 없습니다.');
    }
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    const comment = this.gameCommentRepository.create({
      content,
      game,
      user,
    });
    await this.gameCommentRepository.save(comment);

    return { message: '댓글이 작성되었습니다.', content };
  }

  // 전체 댓글 조회
  async getAllComments(gameId: number) {
    const comments = await this.gameCommentRepository.find({ where: { game: { id: gameId } } });

    if (comments.length === 0) {
      throw new NotFoundException('댓글이 존재하지 않습니다.');
    }
    return comments;
  }

  //댓글 수정
  async updateComment(commentId: number, userId: number, gameId: number, updateGameCommentDto: UpdateGameCommentDto) {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('해당 게임을 찾을 수 없습니다.');
    }
    const comment = await this.gameCommentRepository.findOne({
      where: {
        id: commentId,
        game: { id: gameId },
      },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.user.id !== userId) {
      throw new UnauthorizedException('댓글을 수정할 수 있는 권한이 없습니다.');
    }

    const { content } = updateGameCommentDto;
    comment.content = content;
    await this.gameCommentRepository.save(comment);
    return { message: '댓글이 수정되었습니다.', content: comment.content };
  }

  // 댓글 삭제
  async deleteComment(commentId: number, gameId: number, userId: number) {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('해당 게임을 찾을 수 없습니다.');
    }

    const comment = await this.gameCommentRepository.findOne({
      where: {
        id: commentId,
        game: { id: gameId },
      },
      relations: ['user'],
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    if (comment.user.id !== userId) {
      throw new UnauthorizedException('댓글을 수정할 수 있는 권한이 없습니다.');
    }

    await this.gameCommentRepository.remove(comment);
    return { message: '댓글이 삭제되었습니다.' };
  }
}
