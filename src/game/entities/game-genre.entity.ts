import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InterestGenre } from '../../user/entities/interestGenre.entity';
import { Game } from './game.entity';
import { GameGenre } from '../type/game-genre.type';

@Entity({ name: 'genre' })
export class Genre {
  @PrimaryGeneratedColumn({ unsigned: true, name: 'id' })
  id: number;

  @Column({ type: 'varchar' })
  gameGenre: GameGenre;

  @OneToMany(() => InterestGenre, interestGenre => interestGenre.genre)
  @JoinColumn({ name: 'interestGenre_id' })
  interestGenre: InterestGenre[];

  @OneToMany(() => Game, game => game.genre)
  game: Game[];
}
