import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DMRoom } from './DM-room.entity';

@Entity({ name: 'friendship' })
export class Friendship {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ default: false })
  is_friend: boolean;

  @ManyToOne(() => User, user => user.friendshipsAsUser)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => User, user => user.friendshipsAsFriend)
  @JoinColumn({ name: 'friend_id', referencedColumnName: 'id' })
  friend: User;

  @OneToOne(() => DMRoom, DMRoom => DMRoom.friendship)
  @JoinColumn({ name: 'DM_room_id', referencedColumnName: 'id' })
  DMroom: DMRoom;
}
