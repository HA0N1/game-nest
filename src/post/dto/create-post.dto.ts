import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Category } from '../entities/type/post.type';
export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: '제목을 입력해주세요' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '내용을 입력해주세요' })
  content: string;

  @IsEnum(Category)
  @IsNotEmpty({ message: '카테고리를 입력해주세요' })
  category: Category;
}
