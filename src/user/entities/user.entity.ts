import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Friendship } from 'src/friend/entities/friendship.entity';
import { Like } from './like.entity';
import { Post } from '../../post/entities/post.entity';
import { PostComment } from '../../comment/entities/comment.entity';
import { ChannelDMs } from '../../channel/entities/channelDMs.entity';
import { ChannelMember } from '../../channel/entities/channelMember.entity';
import { FriendDMs } from 'src/friend/entities/friendDMs.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { InterestGenre } from './interestGenre.entity';
import { GameComment } from 'src/game/entities/game-comment.entity';

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

  @OneToMany(() => GameComment, gameComment => gameComment.user)
  gameComment: GameComment[];

  @OneToMany(() => InterestGenre, interestGenre => interestGenre.user)
  @JoinColumn({ name: 'interestGenre_id' })

  // @OneToOne(()=>File, (file) => file.user)
  // file:File
  interestGenre: InterestGenre[];

  @OneToMany(() => FriendDMs, friendDMs => friendDMs.DMRoom)
  @JoinColumn({ name: 'friend_DM_id' })
  friendDMS: FriendDMs[];
}
