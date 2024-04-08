import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Game } from './entities/game.entity';
import { Repository } from 'typeorm';
import { PlatformEnum } from './type/game-platform.type';
// import * as cheerio from 'cheerio';
// import { GameGenre } from './type/game-genre.type';

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
  //FIXME: 스케줄러 적용하기(redis를 통해 적용하려면 불큐 사용해야함)
  async saveFilteredGames() {
    const gameIds = await this.findAllGameIds();

    for (const appId of gameIds) {
      try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const appData = response.data[appId.toString()];

        if (appData && appData.success) {
          const details = appData.data;
          if (
            details.type === 'game' &&
            details.supported_languages &&
            details.supported_languages.includes('Korean')
          ) {
            const mapGenreToId = genres => {
              const genreMapping = {
                Adventure: 1,
                RPG: 2,
                Action: 3,
                Strategy: 4,
                Simulation: 5,
                Casual: 6,
                Indie: 7,
                Racing: 8,
                Sports: 9,
              };

              for (const genre of genres) {
                for (const [key, value] of Object.entries(genreMapping)) {
                  if (genre.description === key) {
                    return value;
                  }
                }
              }
              return null;
            };
            const gameGenre = mapGenreToId(details.genres);
            const pc = PlatformEnum.PC;
            const existingGame = await this.gameRepository.findOne({ where: { title: details.name } });
            if (existingGame) {
              console.log(`${details.name}은 이미 저장된 게임입니다.`);
              continue;
            }

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
              genre: { id: gameGenre },
            };
            await this.gameRepository.save(gameToSave);
          }
        }
      } catch (error) {
        error;
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

  // 게임 목록 조회
  async getGameList(page = 1, limit = 10) {
    try {
      page = Math.max(page, 1);
      limit = Math.max(limit, 1);

      const offset = (page - 1) * limit;

      const [games, total] = await this.gameRepository.findAndCount({
        select: ['title', 'screen_shot'],
        skip: offset,
        take: limit,
      });
      return {
        data: games,
        total: total,
        page: page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error('게임 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  // 게임 상세 조회
  async getGameDetail(id: number) {
    const game = await this.gameRepository.findOneBy({ id });
    if (!game) {
      throw new NotFoundException(`id가 ${id}인 게임을 찾을 수 없습니다.`);
    }
    return game;
  }

  //TODO: 플랫폼별 조회

  //TODO: 장르별 조회
  async getGameByGenre(genre_id: number) {
    const games = await this.gameRepository.find({
      where: { genre: { id: genre_id } },
      select: ['title', 'screen_shot'],
    });
    if (games.length === 0) {
      throw new NotFoundException('해당하는 장르의 게임을 찾을 수 없습니다.');
    }
    return games;
  }

  //TODO: 인기순 조회 - 스팀 API 찾아보기

  //TODO: 신작 조회
}
