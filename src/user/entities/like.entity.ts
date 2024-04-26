import { Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Post } from '../../post/entities/post.entity';

@Entity({ name: 'likes' })
export class Like {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => User, user => user.like)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Post, post => post.like)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
