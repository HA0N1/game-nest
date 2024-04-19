import { IsNotEmpty, IsString } from 'class-validator';

export class BeFriendDto {
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  @IsString()
  email: string;
}
