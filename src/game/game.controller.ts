import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  //스팀 게임 정보 저장
  @Get('filterGames')
  async saveFilteredGames() {
    await this.gameService.saveFilteredGames();
    return { message: '스팀 게임 정보가 저장되었습니다.' };
  }

  // 게임 목록 조회
  @Get()
  async getGameList(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const maxLimit = 50;
    if (limit > maxLimit) {
      throw new HttpException(`최대 검색 가능 개수는 ${maxLimit}개입니다.`, HttpStatus.BAD_REQUEST);
    }

    const games = await this.gameService.getGameList(page, limit);
    return games;
  }

  // 게임 상세 조회
  @Get(':id')
  async getGameDetail(@Param('id') id: number) {
    const game = await this.gameService.getGameDetail(id);
    return game;
  }

  // 장르별 게임 조회
  @Get('/genre/:genre_id')
  async getGameByGenre(@Param('genre_id') genre_id: number) {
    const games = await this.gameService.getGameByGenre(genre_id);
    return games;
  }
}
