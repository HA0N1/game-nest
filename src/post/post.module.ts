import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post } from './entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';
import { User } from 'src/user/entities/user.entity';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { Like } from 'src/user/entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, File, User, Like]), UserModule],
  controllers: [PostController],
  providers: [PostService, AwsService, JwtStrategy],
})
export class PostModule {}
