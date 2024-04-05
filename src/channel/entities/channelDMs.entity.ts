import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChannelChat } from './channelChat.entity';

<<<<<<< HEAD
@Entity({ name: 'channel_dms' })
=======
@Entity({ name: 'channelDMs' })
>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
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

<<<<<<< HEAD
  @ManyToOne(() => ChannelChat, channelChat => channelChat.channelDMs)
=======
  @ManyToOne(() => ChannelChat, channelChat => channelChat.channelDMs, { onDelete: 'CASCADE' })
>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
  @JoinColumn({ name: 'channel_chat_id' })
  channelChat: ChannelChat[];
}
