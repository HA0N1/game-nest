import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChannelChat } from './channelChat.entity';

@Entity({ name: 'channelDMs' })
export class ChannelDMs {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.friendDms)
  @JoinColumn({ name: 'sender_id' })
  user: User;

  @ManyToOne(() => ChannelChat, channelChat => channelChat.channelDMs)
  @JoinColumn({ name: 'channel_chat_id' })
  channelChat: ChannelChat[];
}
