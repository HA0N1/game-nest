import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePWDto {
  @IsString()
  @IsNotEmpty({ message: '변경할 비밀번호를 입력하세요' })
  originPassword: string;

  @IsString()
  @IsNotEmpty({ message: '변경할 비밀번호를 입력하세요' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호 확인을 입력하세요' })
  passwordCheck: string;
}
