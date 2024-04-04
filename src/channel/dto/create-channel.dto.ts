import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty({ message: '채널 이름은 필수입니다.' })
  name: string;

  @IsNumber()
  @IsNotEmpty({ message: '게임 선택은 필수입니다.' })
  gameId: number;
}
