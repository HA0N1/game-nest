import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostComment } from './entities/comment.entity';
import { Post } from 'src/post/entities/post.entity';
import { APP_FILTER } from '@nestjs/core';
import { TokenExpiredFilter } from 'src/auth/guard/exception.filter';

@Module({
  imports: [TypeOrmModule.forFeature([PostComment, Post])],
  controllers: [CommentController],
  providers: [CommentService, { provide: APP_FILTER, useClass: TokenExpiredFilter }],
})
export class CommentModule {}
