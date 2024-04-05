import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
<<<<<<< HEAD
import { ChannelDMs } from './channelDMs.entity';
import { Channel } from './channel.entity';
import { ChannelMember } from './channelMember.entity';
import { ChatType } from '../type/channel-chat.type';

@Entity({ name: 'channel_chat' })
=======
import { ChatType } from '../type/channel-chat.type';
import { Channel } from './channel.entity';
import { ChannelDMs } from './channelDMs.entity';
import { ChannelMember } from './channelMember.entity';

@Entity({ name: 'channelChat' })
>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
export class ChannelChat {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

<<<<<<< HEAD
  @Column({ type: 'enum', enum: ChatType })
  chatType: ChatType;

  @Column({ type: 'bigint' })
  maximum_people: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Channel, channel => channel.channelChat)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

=======
  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'enum', enum: ChatType })
  chatType: ChatType;

  @Column({ type: 'bigint' })
  maximumPeople: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Channel, channel => channel.channelChat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

>>>>>>> 1bc98f8b18a01d74c86ac6071fd8f271b3b0bc93
  @OneToMany(() => ChannelDMs, channelDMs => channelDMs.channelChat)
  @JoinColumn({ name: 'channel_chat_id' })
  channelDMs: ChannelDMs[];

  @ManyToOne(() => ChannelMember, channelMember => channelMember.channelChat)
  @JoinColumn({ name: 'channel_member_id' })
  channelMember: ChannelMember;
}
