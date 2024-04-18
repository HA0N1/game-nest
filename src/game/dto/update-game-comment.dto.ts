import { PartialType } from '@nestjs/mapped-types';
import { CreateGameCommentDto } from './create-game-comment.dto';

export class UpdateGameCommentDto extends PartialType(CreateGameCommentDto) {}
