import { User } from '../../user/entities/user.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Genre } from '../../game/entities/gameGenre.entity';

@Entity({ name: 'interestGenre' })
export class InterestGenre {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => User, user => user.interestGenre, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Genre, genre => genre.interestGenre, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'genre_id', referencedColumnName: 'id' })
  genre: Genre;

  @Column()
  genre_id: number;
}
