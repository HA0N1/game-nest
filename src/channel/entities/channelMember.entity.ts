import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MemberRole } from '../type/MemberRole.type';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './channel.entity';
import { ChannelChat } from './channelChat.entity';

@Entity({ name: 'channelMember' })
export class ChannelMember {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: MemberRole })
  role: MemberRole;

  @ManyToOne(() => User, user => user.channelMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Channel, channel => channel.channelMember)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @OneToMany(() => ChannelChat, channelChat => channelChat.channelMember)
  channelChat: ChannelChat[];
}
