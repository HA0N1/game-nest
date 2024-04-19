import { IsEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateChannelDto {
  @IsString()
  @IsEmpty({ message: '변경할 채널 이름을 적어주세요.' })
  name: string;
}
