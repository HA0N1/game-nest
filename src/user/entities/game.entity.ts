import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Channel } from "./channel.entity"
import { PlatformEnum } from "./type/game-platform.type"

@Entity({name : 'game'})
export class Game {
@PrimaryGeneratedColumn({unsigned :true})
id : number

@Column({type : 'varchar'})
developer : string

@Column({type : 'varchar'})
title : string

@Column({type : 'text'})
description : string

@Column({type : 'varchar'})
screen_shot : string

@Column({type : 'int'})
metacritic : number

@Column({type : 'varchar'})
supported_languages : string

@Column({type : 'varchar'})
pc_requirements : string

@Column({type : 'datetime'})
release_date : Date

@Column({type : 'enum', enum: PlatformEnum})
platform : PlatformEnum

@Column({type : 'varchar'})
publisher : string

// @OneToOne(()=>Genre, (genre) => genre.game)
// @JoinColumn({name : 'genre_id'})
// genre: Genre

@OneToMany(()=>Channel, (channel) => channel.game)
channel: Channel[]

//TODO: file 상의
// @ManyToOne(()=>Like, (like) => like.post)
// file: File
}
