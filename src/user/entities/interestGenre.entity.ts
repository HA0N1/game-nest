import { User } from './user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';
import { Genre } from '../../game/entities/game-genre.entity';

@Entity({ name: 'interest_genre' })
export class InterestGenre {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => User, user => user.interestGenre)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Genre, genre => genre.interestGenre)
  @JoinColumn({ name: 'genre_id', referencedColumnName: 'id' })
  genre: Genre;

  @DeleteDateColumn({ default: null })
  deleteAt: Date;
}
