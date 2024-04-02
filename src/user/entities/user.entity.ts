import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Friendship } from './friendship.entity';
import { Like } from './like.entity';
import { Post } from '../../post/entities/post.entity';
import { PostComment } from '../../comment/entities/comment.entity';
import { ChannelDMs } from '../../channel/entities/channelDMs.entity';
import { ChannelMember } from '../../channel/entities/channelMember.entity';
import { FriendDMs } from './friendDMs.entity';
import { Channel } from 'src/channel/entities/channel.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'int' })
  imageId: number;

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
  // @OneToOne(()=>File, (file) => file.user)
  // file:File

  // @ManyToOne(()=>InterestGenre, (interestGenre) => interestGenre.user)
  // @JoinColumn({name: interestGgenre_id})
  // interestGenre: InterestGenre

  // @OneToMany(()=>GameComment, (gameComment) => gameComment.user)
  // gameComment: GameComment[]
}
