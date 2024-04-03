import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  //스팀 게임 정보 저장
  @Get('filteredGames')
  async filteredGames() {
    await this.gameService.filteredGames();
    return { message: '스팀 게임 정보가 저장되었습니다.' };
  }
}
