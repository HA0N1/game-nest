import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DMRoom } from './DM-room.entity';
import { File } from 'src/aws/entities/file.entity';

@Entity({ name: 'friend_dms' })
export class FriendDMs {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.friendDms)
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => DMRoom, dmRoom => dmRoom.friendDMs)
  @JoinColumn({ name: 'DM_room_id', referencedColumnName: 'id' })
  DMRoom: DMRoom;

  @ManyToOne(() => File, file => file.friendms)
  @JoinColumn({ name: 'file_id' })
  file: File;
}
