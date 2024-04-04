import { User } from '../../user/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Genre } from './gameGenre.entity';

@Entity({ name: 'interest_genre' })
export class InterestGenre {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => User, user => user.interestGenre)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Genre, genre => genre.interestGenre)
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;
}
