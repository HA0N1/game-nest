import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Channel } from '../../channel/entities/channel.entity';
import { PlatformEnum } from '../type/game-platform.type';
import { GameComment } from './game-comment.entity';
import { Genre } from './game-genre.entity';

@Entity({ name: 'game' })
export class Game {
  @PrimaryGeneratedColumn({ unsigned: true, name: 'id' })
  id: number;

  @Column({ type: 'varchar' })
  developer: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar' })
  screen_shot: string;

  @Column({ type: 'int' })
  metacritic: number;

  @Column({ type: 'text' })
  supported_languages: string;

  @Column({ type: 'varchar' })
  pc_requirements: string;

  @Column({ type: 'datetime' })
  release_date: Date;

  @Column({ type: 'varchar' })
  price: string;

  @Column({ type: 'enum', enum: PlatformEnum })
  platform: PlatformEnum;

  @Column({ type: 'varchar' })
  publisher: string;

  @Column({ type: 'int', unsigned: true })
  genre_id: number;

  @ManyToOne(() => Genre, genre => genre.game)
  @JoinColumn({ name: 'genre_id', referencedColumnName: 'id' })
  genre: Genre;

  @OneToMany(() => Channel, channel => channel.game)
  channel: Channel[];

  @OneToMany(() => GameComment, gameComment => gameComment.game)
  gameComment: GameComment[];

  //TODO: file 상의
  // @ManyToOne(()=>Like, (like) => like.post)
  // file: File
}
