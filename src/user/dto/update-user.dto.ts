import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty({ message: '변경할 닉네임을 입력하세요' })
  nickname: string;
}
