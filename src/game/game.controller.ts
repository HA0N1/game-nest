import { Controller, Get, Param } from '@nestjs/common';
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
  async getGameList() {
    const games = await this.gameService.getGameList();
    return games;
  }

  // 게임 상세 조회
  @Get(':id')
  async getGameDetail(@Param('id') id: number) {
    const game = await this.gameService.getGameDetail(id);
    return game;
  }

  // @Get(':genre_id')
  // async getGameByGenre(@Param('genre_id') genre_id: number) {
  //   const games = await this.gameService.getGameByGenre(genre_id);
  //   return games;
  // }
}
