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

@Controller('games')
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
  async getGames(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const maxLimit = 50;
    if (limit > maxLimit) {
      throw new HttpException(`최대 검색 가능 개수는 ${maxLimit}개입니다.`, HttpStatus.BAD_REQUEST);
    }

    const games = await this.gameService.getGames(page, limit);
    return games;
  }

  // 게임 상세 조회
  @Get('game/:gameId')
  async getGameDetail(@Param('gameId') id: number) {
    const game = await this.gameService.getGameDetail(id);
    return game;
  }

  // 장르별 게임 조회
  @Get('genre/:genre_id')
  async getGamesByGenre(
    @Param('genre_id') genre_id: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const maxLimit = 50;
    if (limit > maxLimit) {
      throw new HttpException(`최대 검색 가능 개수는 ${maxLimit}개입니다.`, HttpStatus.BAD_REQUEST);
    }
    const games = await this.gameService.getGamesByGenre(genre_id, page, limit);
    return games;
  }

  // 인기순 저장
  @Get('savePopularGames')
  async savePopularGames() {
    const popularGames = await this.gameService.savePopularGames();

    return popularGames;
  }

  // 인기순 조회
  @Get('popularGames')
  async getPopularGames(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const popularGames = await this.gameService.getPopularGames(pageNumber, limitNumber);

    return popularGames;
  }

  // 신작 저장
  @Get('saveNewGames')
  async saveNewGames() {
    const newGames = await this.gameService.saveNewGames();

    return newGames;
  }

  //신작 조회
  @Get('newGames')
  async getNewGames(@Query('page') page: string, @Query('limit') limit: string) {
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const newGames = this.gameService.getNewGames(pageNumber, limitNumber);
    return newGames;
  }
}