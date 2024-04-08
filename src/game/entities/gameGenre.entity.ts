import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GameGenre } from '../type/game-genre.type';
import { InterestGenre } from '../../user/entities/interestGenre.entity';
import { Game } from './game.entity';

@Entity({ name: 'genre' })
export class Genre {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'varchar' })
  gameGenre: GameGenre;

  @OneToMany(() => InterestGenre, interestGenre => interestGenre.genre)
  @JoinColumn({ name: 'interestGenre_id' })
  interestGenre: InterestGenre[];

  @OneToMany(() => Game, game => game.genre)
  @JoinColumn({ name: 'genre_id' })
  game: Game[];
}
