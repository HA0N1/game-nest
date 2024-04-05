import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
<<<<<<< HEAD
import { User } from '../../user/entities/user.entity';
import { Channel } from './channel.entity';
import { ChannelChat } from './channelChat.entity';
import { MemberRole } from '../type/MemberRole.type';

@Entity({ name: 'channel_member' })
=======
import { MemberRole } from '../type/MemberRole.type';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './channel.entity';
import { ChannelChat } from './channelChat.entity';

@Entity({ name: 'channelMember' })
>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
export class ChannelMember {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'enum', enum: MemberRole })
  role: MemberRole;

<<<<<<< HEAD
  @ManyToOne(() => User, user => user.friendDms)
=======
  @ManyToOne(() => User, user => user.channelMember, { onDelete: 'CASCADE' })
>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Channel, channel => channel.channelMember)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @OneToMany(() => ChannelChat, channelChat => channelChat.channelMember)
<<<<<<< HEAD
  channelChat: ChannelChat;
=======
  channelChat: ChannelChat[];
>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
}
