import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelChat } from './channelChat.entity';
import { ChannelMember } from './channelMember.entity';
import { Game } from '../../game/entities/game.entity';

@Entity({ name: 'channel' })
export class Channel {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 20 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Game, game => game.channel)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @OneToMany(() => ChannelChat, channelChat => channelChat.channel)
  channelChat: ChannelChat[];

  @OneToMany(() => ChannelMember, channelMember => channelMember.channel)
  channelMember: ChannelMember[];
}
