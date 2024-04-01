<<<<<<< HEAD
import {  Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, ManyToOne } from "typeorm"
=======
import {  Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
>>>>>>> 97384a1d465a878a0df2f6f2270b03206f08305a
import { User } from "./user.entity"
import { DMRoom } from "./DM-room.entity"


@Entity({name: 'friendship'})
export class Friendship {
@PrimaryGeneratedColumn({unsigned :true})
id : number

@Column({default:false})
is_friend : boolean

@ManyToOne(() => User, (user) => user.friendshipsAsUser)
@JoinColumn({ name: "user_id", referencedColumnName: "id" })
user: User;

@ManyToOne(() => User, (user) => user.friendshipsAsFriend)
@JoinColumn({ name: "friend_id", referencedColumnName: "id" })
friend: User;

@OneToOne(()=>DMRoom, (DMRoom)=> DMRoom.friendship)
DMroom: DMRoom
}