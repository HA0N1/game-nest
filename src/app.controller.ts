import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { GameService } from './game/game.service';
import hbs from 'hbs';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly gameService: GameService,
  ) {}

  @Get('login')
  getLoginPage(@Res() res: Response) {
    const staticPath = this.configService.get<string>('STATIC_FILES_PATH');
    const filePath = join(process.cwd(), 'dist', staticPath, 'login.html');
    res.sendFile(filePath);
  }

  @Get('chat')
  getChatPage(@Res() res: Response) {
    const staticPath = this.configService.get<string>('STATIC_FILES_PATH');
    const filePath = join(process.cwd(), 'dist', staticPath, 'chat.hbs');
    res.sendFile(filePath);
  }

  // @Get('channel')
  // @Render('channel.hbs')
  // getChannelPage() { // @Res() res: Response
  //   const staticPath = this.configService.get<string>('STATIC_FILES_PATH');
  //   const filePath = join(process.cwd(), 'dist', staticPath, 'channel.hbs');
  //   res.sendFile(filePath);
  // }

  @Get('main')
  @Render('main.hbs')
  async getGames(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(40), ParseIntPipe) limit: number,
  ) {
    const result = await this.gameService.getGames(page, limit);
    return { games: result.data };
  }

  @Get('game/:id')
  @Render('game-detail.hbs')
  async getGamePage(@Param('id') id: number) {
    const game = await this.gameService.getGameDetail(id);

    const idToGenreMapping = {
      1: 'Adventure',
      2: 'RPG',
      3: 'Action',
      4: 'Strategy',
      5: 'Simulation',
      6: 'Casual',
      7: 'Indie',
      8: 'Racing',
      9: 'Sports',
    };
    const genreName = idToGenreMapping[game.genre_id];
    const gameDetail = {
      ...game,
      genreName,
    };
    return { game: gameDetail };
  }

  @Get('popular-game')
  @Render('popular-game.hbs')
  async getPopularGamesPage(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    const result = await this.gameService.getPopularGames(page, limit);

    return { popularGames: result.data, page: result.page, limit: result.limit, lastPage: result.lastPage };
  }

  @Get('genre/:genreId')
  @Render('genre-game.hbs')
  async getGamesByGenre(
    @Param('genreId') genreId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const result = await this.gameService.getGamesByGenre(+genreId, page, limit);

    return { data: result.data, page: result.page, limit: result.limit, lastPage: result.lastPage };
  }

  @Get('new-game')
  @Render('new-game.hbs')
  async getNewGames(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    const result = await this.gameService.getNewGames(page, limit);

    return { data: result.data, page: result.page, limit: result.limit };
  }
}
hbs.registerHelper('decrement', function (value) {
  return value - 1;
});

hbs.registerHelper('increment', function (value) {
  return value + 1;
});
