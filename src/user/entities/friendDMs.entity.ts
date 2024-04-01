import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity"
import { DMRoom } from "./DM-room.entity"

//TODO:file id는 어떻게 넣을지 상의해보기
@Entity({name: 'friendDMs'})
export class FriendDMs {
@PrimaryGeneratedColumn({unsigned :true})
id : number
    
@Column({type : 'text'})
content : string

@CreateDateColumn()
createdAt : Date

@ManyToOne(()=> User, (user)=> user.friendDms)
@JoinColumn({name : 'sender_id'})
user : User

@ManyToOne(()=> User, (user)=> user.friendDms)
@JoinColumn({name : 'DM_room_id'})
DMRoom : DMRoom[]
}