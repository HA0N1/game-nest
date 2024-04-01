import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { ChannelDMs } from "./channelDMs.entity"
import { Channel } from "./channel.entity"
import { ChannelMember } from "./channelMember.entity"
import { ChatType } from "./type/channel-chat.type"


@Entity({name: 'channelChat'})
export class ChannelChat {
@PrimaryGeneratedColumn({unsigned :true})
id : number
    
@Column({type : 'enum', enum : ChatType})
chatType:ChatType

@Column({type : 'bigint'})
maximum_people : number

@CreateDateColumn()
createdAt : Date

@ManyToOne(()=> Channel, (channel)=> channel.channelChat)
@JoinColumn({name : 'channel_id'})
channel : Channel

@OneToMany(()=> ChannelDMs, (channelDMs)=> channelDMs.channelChat)
@JoinColumn({name : 'channel_chat_id'})
channelDMs : ChannelDMs[]

@ManyToOne(()=> ChannelMember, (channelMember)=> channelMember.channelChat)
@JoinColumn({name : 'channel_member_id'})
channelMember : ChannelMember
}