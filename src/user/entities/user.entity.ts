import {
  Column,
  CreateDateColumn,
  Entity,
<<<<<<< HEAD
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

=======
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
>>>>>>> 1bbb4e23a419543976966bfe35f1e93b8c6c0f8e
import { Friendship } from './friendship.entity';
import { Like } from './like.entity';
import { Post } from '../../post/entities/post.entity';
import { PostComment } from '../../comment/entities/comment.entity';
import { ChannelDMs } from '../../channel/entities/channelDMs.entity';
import { ChannelMember } from '../../channel/entities/channelMember.entity';
import { FriendDMs } from './friendDMs.entity';
<<<<<<< HEAD
import { Channel } from 'src/channel/entities/channel.entity';
=======
import { GameComment } from '../../game/entities/gameComment.entity';
import { InterestGenre } from '../entities/interestGenre.entity';
>>>>>>> 1bbb4e23a419543976966bfe35f1e93b8c6c0f8e

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  // @Column({ type: 'int' })
  // imageId?: number;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ type: 'varchar' })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => FriendDMs, friendDms => friendDms.user)
  friendDms: FriendDMs[];

  @OneToMany(() => Friendship, friendship => friendship.user)
  friendshipsAsUser: Friendship[];

  @OneToMany(() => Friendship, friendship => friendship.friend)
  friendshipsAsFriend: Friendship[];

  @OneToMany(() => Like, like => like.user)
  like: Like[];

  @OneToMany(() => Post, post => post.user)
  post: Post[];

  @OneToMany(() => PostComment, postComment => postComment.user)
  postComment: PostComment[];

  @OneToMany(() => ChannelDMs, channelDMs => channelDMs.user)
  channelDMs: ChannelDMs[];

  @OneToMany(() => ChannelMember, channelMember => channelMember.user)
  channelMember: ChannelMember[];
<<<<<<< HEAD
=======

  @OneToMany(() => GameComment, gameComment => gameComment.user)
  gameComment: GameComment[];

>>>>>>> 1bbb4e23a419543976966bfe35f1e93b8c6c0f8e
  // @OneToOne(()=>File, (file) => file.user)
  // file:File
  // @OneToMany(()=>GameComment, (gameComment) => gameComment.user)
  // gameComment: GameComment[]

  @OneToMany(() => InterestGenre, interestGenre => interestGenre.user)
  @JoinColumn({ name: 'interestGenre_id' })
  interestGenre: InterestGenre[];

  @OneToMany(() => FriendDMs, friendDMs => friendDMs.DMRoom)
  @JoinColumn({ name: 'friend_DM_id' })
  friendDMS: FriendDMs[];
}
