import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';
import { GameComment } from './entities/game-comment.entity';
import { GameCommentController } from './game-comment/game-comment.controller';
import { GameCommentService } from './game-comment/game-comment.service';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Game, GameComment])],
  controllers: [GameController, GameCommentController],
  providers: [GameService, GameCommentService],
  exports: [TypeOrmModule],
})
export class GameModule {}
