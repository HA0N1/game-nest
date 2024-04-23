import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity({ name: 'game_comment' })
export class GameComment {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.gameComment)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Game, game => game.gameComment)
  @JoinColumn({ name: 'game_id' })
  game: Game;
}
