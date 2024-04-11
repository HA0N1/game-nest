import { Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Friendship } from 'src/friend/entities/friendship.entity';
import { FriendDMs } from './friendDMs.entity';

@Entity({ name: 'dm_room' })
export class DMRoom {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @OneToOne(() => Friendship, friendship => friendship.DMroom)
  @JoinColumn({ name: 'friendship_id', referencedColumnName: 'id' })
  friendship: Friendship;

  @OneToMany(() => FriendDMs, friendDMs => friendDMs.DMRoom)
  @JoinColumn({ name: 'friend_DM_id', referencedColumnName: 'id' })
  friendDMs: FriendDMs[];
}
