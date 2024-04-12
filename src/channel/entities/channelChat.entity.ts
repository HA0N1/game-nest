import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatType } from '../type/channel-chat.type';
import { Channel } from './channel.entity';
import { ChannelDMs } from './channelDMs.entity';
import { ChannelMember } from './channelMember.entity';

@Entity({ name: 'channel_chat' })
export class ChannelChat {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'varchar', default: 'Untitled' })
  title: string;

  @Column({ type: 'enum', enum: ChatType })
  chatType: ChatType;

  @Column({ type: 'bigint' })
  maximumPeople?: number;

  @Column({ type: 'int', name: 'channel_id', unsigned: true })
  channelId: number;

  @Column({ type: 'int', name: 'channel_member_id', unsigned: true, nullable: true })
  channelMemberId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Channel, channel => channel.channelChat)
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @OneToMany(() => ChannelDMs, channelDMs => channelDMs.channelChat)
  @JoinColumn({ name: 'channel_chat_id' })
  channelDMs: ChannelDMs[];

  @ManyToOne(() => ChannelMember, channelMember => channelMember.channelChat)
  @JoinColumn({ name: 'channel_member_id' })
  channelMember: ChannelMember;
}
