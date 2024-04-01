import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Post } from "./post.entity";

@Entity({name: 'postComment'})
export class PostComment{
@PrimaryGeneratedColumn({unsigned :true})
id : number

@Column({type : 'text'})
content : string

@CreateDateColumn()
createdAt : Date

@UpdateDateColumn()
updatedAt : Date

@ManyToOne(()=>User, (user) => user.postComment)
@JoinColumn({name : 'user_id'})
user: User

@ManyToOne(()=>Post, (post) => post.postComment)
@JoinColumn({name : 'post_id'})
post: Post
}