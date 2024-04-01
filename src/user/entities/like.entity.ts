import {  Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./user.entity"
import { Post } from "./post.entity"


@Entity({name: 'like'})
export class Like {
@PrimaryGeneratedColumn({unsigned :true})
id : number
    
@OneToOne(()=>User, (user) => user.like)
@JoinColumn({name: 'user_id'})
user: User

@OneToMany(()=>Post, (post) => post.like)
@JoinColumn({name: 'post_id'})
post: Post[]
}