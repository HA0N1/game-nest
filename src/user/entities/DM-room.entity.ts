import {  Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Friendship } from "./friendship.entity"



@Entity({name: 'DMRoom'})
export class DMRoom {
@PrimaryGeneratedColumn({unsigned :true})
id : number
    
@OneToOne(()=>Friendship, (friendship) => friendship.DMroom)
@JoinColumn({name: 'friendship_id'})
friendship: Friendship
}