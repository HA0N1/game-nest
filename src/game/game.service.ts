import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import { PlatformEnum } from './type/game-platform.type';
import * as cheerio from 'cheerio';
import { GameGenre } from './type/game-genre.type';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  // https://api.steampowered.com/ISteamApps/GetAppList/v2/ 사이트에서 게임 id 찾기
  async findAllGameIds() {
    try {
      const response = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
      const allGames = response.data;
      const gameIds = allGames.applist.apps.map(app => app.appid);
      return gameIds;
    } catch (error) {
      error;
    }
  }

  // 스팀 게임 저장
  //FIXME: 스케줄러 적용하기
  async saveFilteredGames() {
    const gameIds = await this.findAllGameIds();

    for (const appId of gameIds) {
      try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const appData = response.data[appId.toString()];

        if (appData && appData.success) {
          const details = appData.data;
          if (details.type === 'game' && details.supported_languages.includes('Korean')) {
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

            // 매핑된 장르 9개 돌면서 처음으로 맞는 장르로 매핑
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
        throw new Error('게임을 저장하던 중 오류가 발생했습니다.');
      }
    }
  }

  //TODO: PS 게임 정보 스크래핑
  // 보류
  // async playStationGames(): Promise<void> {
  //   try {
  //     const url = 'https://store.playstation.com/ko-kr/pages/latest';
  //     const { data } = await axios.get(url);
  //     const $ = cheerio.load(data);
  //     const ps = PlatformEnum.PS;

  //     const gamePromises = $('.game-list-item')
  //       .map(async (i, elem) => {
  //         const game = new Game();
  //         // game.developer =
  //         game.title = $(elem).find('h1[data-qa="mfe-game-title#name"]').text().trim();
  //         game.description = $(elem).find('p[data-qa="mfe-game-overview#description"]').text().trim();
  //         game.screen_shot = 'img[data-qa="gameBackgroundImage#heroImage#image"]';
  //         // game.metacritic =
  //         game.supported_languages = $(elem).find('dd[data-qa="gameInfo#releaseInformation#subtitles-value"]').text();
  //         const releaseDateString = $(elem)
  //           .find('dd[data-qa="gameInfo#releaseInformation#releaseDate-value"]')
  //           .text()
  //           .trim();
  //         const releaseDate = new Date(releaseDateString);
  //         game.release_date = releaseDate;
  //         game.platform = ps;
  //         game.publisher = $(elem).find('dd[data-qa="gameInfo#releaseInformation#publisher-value"]').text().trim();

  //         const genreMapping = {
  //           액션: GameGenre.Action,
  //           롤플레잉: GameGenre.RolePlaying,
  //           어드벤처: GameGenre.Adventure,
  //           시뮬레이션: GameGenre.Simulation,
  //           슈팅: GameGenre.Shooting,
  //           스포츠: GameGenre.SportsRacing,
  //           퍼즐: GameGenre.Puzzle,
  //           음악: GameGenre.Music,
  //         };
  //         const genreIdMapping = {
  //           Action: 1,
  //           Shooting: 2,
  //           RolePlaying: 3,
  //           Strategy: 4,
  //           Adventure: 5,
  //           Simulation: 6,
  //           SportsRacing: 7,
  //           Puzzle: 8,
  //           Music: 9,
  //         };
  //         game.genre = $(elem).find('dd[data-qa="gameInfo#releaseInformation#genre-value]');
  //         return this.gameRepository.save(game);
  //       })
  //       .get();
  //     await Promise.all(gamePromises);
  //   } catch (error) {
  //     error;
  //   }
  // }
  //TODO: NS 게임 정보 스크래핑

  //TODO: Xbox 게임 정보 스크래핑

  //TODO: 페이지네이션 게임 목록 조회
  async getGameList() {
    try {
      const games = await this.gameRepository.find();
      return games;
    } catch (error) {
      throw new Error('게임 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  // 게임 상세 조회
  async getGameDetail(id: number) {
    try {
      const game = await this.gameRepository.findOneBy({ id });
      if (!game) {
        throw new NotFoundException(`id가 ${id}인 게임을 찾을 수 없습니다.`);
      }
      return game;
    } catch (error) {
      throw new Error('게임 상세 조회하는 중 오류가 발생했습니다.');
    }
  }

  //TODO: 플랫폼별 조회

  //TODO: 장르별 조회
  async getGameByGenre(genre_id: number) {
    try {
      const games = await this.gameRepository.find(genre_id);

      if (!games) {
        throw new NotFoundException('해당하는 장르의 게임을 찾을 수 없습니다.');

        return games;
      }
    } catch (error) {
      throw new Error('게임 조회 중 오류가 발생했습니다.');
    }
  }

  //TODO: 인기순 조회 - 스팀 API 찾아보기

  //TODO: 신작 조회
}
