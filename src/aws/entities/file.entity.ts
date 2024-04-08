import { ChannelDMs } from 'src/channel/entities/channelDMs.entity';
import { PostComment } from 'src/comment/entities/comment.entity';
import { Game } from 'src/game/entities/game.entity';
import { Post } from 'src/post/entities/post.entity';
import { FriendDMs } from 'src/user/entities/friendDMs.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'file' })
export class File {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'varchar' })
  filePath: string;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updatedAt: Date;

  // @ManyToOne(()=> User, (user)=> user.file)
  // user : User

  @OneToMany(() => Post, post => post.file, { onDelete: 'CASCADE' })
  post: Post[];

  // @ManyToOne(()=>Game,game=>game.file)
  // game:Game

  // @ManyToOne(()=>ChannelDMs,channeldms=>channeldms.file)
  // channelDMs:ChannelDMs

  // @ManyToOne(()=>FriendDMs,friendms=>friendms.file)
  // friendms:FriendDMs
}
