import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}
  // 이름이 없는 것들 빼고 rawData에 넣기

  // 게임 목록 조회
  async gameList() {
    try {
      const response = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
      const allGames = response.data;

      const filteredGames = allGames.applist.apps.filter(game => game.name.trim() !== '');

      const games = new Game();
      games.rawData = { applist: { apps: filteredGames } };

      await this.gameRepository.save(games);
    } catch (error) {
      error;
    }
  }

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

  async filteredGames() {
    const gameIds = await this.findAllGameIds();

    for (const appId of gameIds) {
      try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const appData = response.data[appId.toString()];

        if (appData && appData.success) {
          const details = appData.data;
          if (details.type === 'game' && /Korean|한국어/.test(details.supported_languages)) {
            const gameToSave = {
              developer: details.developers.join(', '),
              title: details.name,
              description: details.short_description,
              screen_shot: details.screenshots[0]?.path_full,
              metacritic: details.metacritic?.score,
              supported_languages: details.supported_languages,
              pc_requirements: JSON.stringify(details.pc_requirements),
              release_date: new Date(details.release_date.date),
              publisher: details.publishers.join(', '),
            };
            await this.gameRepository.save(gameToSave);
          }
        }
      } catch (error) {
        error;
      }
    }
  }

  // 게임 상세 조회
  async gameDetail() {
    try {
    } catch (error) {
      error;
    }
  }
}
