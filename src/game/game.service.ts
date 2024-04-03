import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import { PlatformEnum } from './type/game-platform.type';
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async findAllGameIds(): Promise<number[]> {
    try {
      const response = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
      const allGames = response.data;
      const gameIds = allGames.applist.apps.map(app => app.appid);
      return gameIds;
    } catch (error) {
      console.error('Error fetching game IDs:', error);
      return [];
    }
  }

  // 스팀 게임 저장
  //FIXME: 플랫폼 고정시켜서 넣기, 장르id 인덱스 넣기
  async filteredGames() {
    const gameIds = await this.findAllGameIds();

    for (const appId of gameIds) {
      try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const appData = response.data[appId.toString()];

        if (appData && appData.success) {
          const details = appData.data;
          if (details.type === 'game' && /Korean|한국어/.test(details.supported_languages)) {
            const genreMapping = {
              Action: 1,
              Shooting: 2,
              RolePlaying: 3,
              Strategy: 4,
              Adventure: 5,
              Simulation: 6,
              SportsRacing: 7,
              Puzzle: 8,
              Music: 9,
            };

            const genreIds = details.genres
              .map(genre => genreMapping[genre.description])
              .filter(id => id !== undefined);

            const gameGenre = genreIds.length > 0 ? genreIds[0] : null;
            const pc = PlatformEnum.PC;

            const gameToSave = {
              developer: details.developers.join(', '),
              title: details.name,
              description: details.short_description,
              screen_shot: details.screenshots[0]?.path_full,
              metacritic: details.metacritic?.score,
              supported_languages: details.supported_languages,
              pc_requirements: JSON.stringify(details.pc_requirements),
              release_date: new Date(details.release_date.date),
              platform: pc,
              publisher: details.publishers.join(', '),
              genre: gameGenre,
            };
            await this.gameRepository.save(gameToSave);
          }
        }
      } catch (error) {
        error;
      }
    }
  }

  //TODO: 게임 상세 조회
  async gameDetail() {
    try {
    } catch (error) {
      error;
    }
  }

  //TODO: 플랫폼별 조회

  //TODO: 장르별 조회

  //TODO: 인기순 조회 - 스팀 API 찾아보기

  //TODO: 신작 조회
}
