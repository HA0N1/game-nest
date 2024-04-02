import { IsNumber } from 'class-validator';

export class InviteMember {
  @IsNumber()
  userId: number;

  @IsNumber()
  channelId: number;
}
