import { IsEnum, IsNotEmpty, IsNumber, IsString, Max } from 'class-validator';
import { ChatType } from '../type/channel-chat.type';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty({ message: '채팅방 이름은 필수입니다.' })
  title: string;

  @IsEnum(ChatType)
  @IsNotEmpty({ message: '채팅방 타입은 필수입니다.' })
  chatType: ChatType;

  @IsNumber()
  @Max(8)
  maximumPeople?: number;
}
