import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async gameList() {
    return await this.gameService.gameList();
  }

  @Get('filteredGames')
  async filteredGames() {
    await this.gameService.filteredGames();
    return { message: 'hi' };
  }
}
