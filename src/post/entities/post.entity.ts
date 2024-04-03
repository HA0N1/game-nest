import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PostComment } from '../../comment/entities/comment.entity';
import { Like } from '../../user/entities/like.entity';
import { Category } from './type/post.type';

@Entity({ name: 'post' })
export class Post {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: Category })
  category: Category;

  @Column({ type: 'bigint' })
  view_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.post)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PostComment, postComment => postComment.post)
  postComment: PostComment[];

  @OneToMany(() => Like, like => like.post)
  like: Like;
}
