import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MemberRole } from '../type/MemberRole.type';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './channel.entity';
import { ChannelChat } from './channelChat.entity';

@Entity({ name: 'channel_member' })
export class ChannelMember {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.User })
  role: MemberRole;

  @Column({ type: 'int', name: 'user_id', unsigned: true })
  userId: number;

  @Column({ type: 'int', name: 'channel_id', unsigned: true })
  channelId: number;

  @ManyToOne(() => User, user => user.channelMember)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Channel, channel => channel.channelMember)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @ManyToOne(() => ChannelChat, channelChat => channelChat.channelMember)
  channelChat: ChannelChat;
}
