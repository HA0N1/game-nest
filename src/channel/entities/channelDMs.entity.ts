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
  senderId: number;

  @Column({ type: 'int', name: 'channel_chat_id', unsigned: true })
  channelChatId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.channelDMs)
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => ChannelChat, channelChat => channelChat.channelDMs)
  @JoinColumn({ name: 'channel_chat_id', referencedColumnName: 'id' })
  channelChat: ChannelChat;
}
