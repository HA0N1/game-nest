import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { MemberRole } from '../type/MemberRole.type';

export class CreateChannelMemberDto {
  @IsEnum(MemberRole)
  role: MemberRole;

  @IsNumber()
  userId: number;

  @IsNumber()
  channelId: number;
}
