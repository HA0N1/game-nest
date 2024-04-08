import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, File])],
  controllers: [PostController],
  providers: [PostService, AwsService],
})
export class PostModule {}
