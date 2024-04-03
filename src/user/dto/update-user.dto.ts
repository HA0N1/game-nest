import { IsArray, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  nickname?: string;

  @IsString()
  password?: string;

  @IsString()
  passwordCheck?: string;

  @IsArray()
  interestGenre?: string[];
}
