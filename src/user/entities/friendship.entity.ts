import {  Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity"
import { DMRoom } from "./DM-room.entity"


@Entity({name: 'friendship'})
export class Friendship {
@PrimaryGeneratedColumn({unsigned :true})
id : number

@Column({type: 'enum', default:false})
is_friend : boolean

@OneToOne(()=>User, (user) => user.like)
@JoinColumn([ { name: "user_id", referencedColumnName: "id" }, { name: "friend_id", referencedColumnName: "id" }])
user: User

@OneToOne(()=>DMRoom, (DMRoom)=> DMRoom.friendship)
DMroom: DMRoom
}