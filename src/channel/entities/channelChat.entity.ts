import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatType } from '../type/channel-chat.type';
import { Channel } from './channel.entity';
import { ChannelDMs } from './channelDMs.entity';
import { ChannelMember } from './channelMember.entity';

@Entity({ name: 'channelChat' })
export class ChannelChat {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

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

  @OneToMany(() => ChannelDMs, channelDMs => channelDMs.channelChat)
  @JoinColumn({ name: 'channel_chat_id' })
  channelDMs: ChannelDMs[];

  @ManyToOne(() => ChannelMember, channelMember => channelMember.channelChat)
  @JoinColumn({ name: 'channel_member_id' })
  channelMember: ChannelMember;
}
