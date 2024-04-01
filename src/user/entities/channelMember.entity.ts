import { Column,Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity"
import { Channel } from "./channel.entity"
import { ChannelChat } from "./channelChat.entity"
import { MemberRole } from "./type/MemberRole.type"


@Entity({name: 'channelMember'})
export class ChannelMember {
@PrimaryGeneratedColumn({unsigned :true})
id : number
    
@Column({type : 'enum', enum: MemberRole})
role : MemberRole


@ManyToOne(()=> User, (user)=> user.friendDms)
@JoinColumn({name : 'user_id'})
user : User

@ManyToOne(()=> Channel, (channel)=> channel.channelMember)
@JoinColumn({name : 'channel_id'})
channel : Channel

@OneToMany(()=> ChannelChat, (channelChat)=> channelChat.channelMember)
channelChat : ChannelChat
}