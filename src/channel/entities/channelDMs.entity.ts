import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChannelChat } from './channelChat.entity';

@Entity({ name: 'channel_dms' })
export class ChannelDMs {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', name: 'sender_id', unsigned: true })
  sender_id: number;

  @Column({ type: 'int', name: 'channel_chat_id', unsigned: true })
  channel_chat_id: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.friendDms)
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => ChannelChat, channelChat => channelChat.channelDMs)
<<<<<<< HEAD
  @JoinColumn({ name: 'channel_chat_id' })
  channelChat: ChannelChat[];
=======
  @JoinColumn({ name: 'channel_chat_id', referencedColumnName: 'id' })
  channelChat: ChannelChat;
>>>>>>> 6571d254d8b0db02d24f7d62875768775fc9acfe
}
