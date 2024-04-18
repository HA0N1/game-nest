import { IsEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDMsDto {
  @IsString()
  @IsEmpty({ message: '메세지의 내용을 입력해주세요' })
  content: string;

  @IsNumber()
  @IsEmpty({ message: '메세지를 전송할 방을 입력해주세요' })
  chatId: number;
}
