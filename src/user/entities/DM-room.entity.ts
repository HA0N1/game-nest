import { Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Friendship } from './friendship.entity';
import { FriendDMs } from './friendDMs.entity';

@Entity({ name: 'DMRoom' })
export class DMRoom {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @OneToOne(() => Friendship, friendship => friendship.DMroom)
  @JoinColumn({ name: 'friendship_id', referencedColumnName: 'id' })
  friendship: Friendship;

  @OneToMany(() => FriendDMs, friendDMs => friendDMs.DMRoom)
  @JoinColumn({ name: 'friend_DM_id', referencedColumnName: 'id' })
  friendDMS: FriendDMs[];
}
