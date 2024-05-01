import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Game } from './entities/game.entity';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { PlatformEnum } from './type/game-platform.type';
import puppeteer from 'puppeteer';
import { Cron } from '@nestjs/schedule';

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
              screen_shot: details.header_image,
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

  // 게임 목록 조회
  async getGames(page = 1, limit = 40) {
    try {
      page = Math.max(page, 1);
      limit = Math.max(limit, 1);

      const offset = (page - 1) * limit;

      const [games, total] = await this.gameRepository.findAndCount({
        select: ['id', 'title', 'screen_shot'],
        skip: offset,
        take: limit,
      });
      return {
        data: games,
        total: total,
        page: page,
        limit: limit,
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
    if (game.metacritic === null) {
      game.metacritic = 0;
    }
    return game;
  }

  // 장르별 조회
  async getGamesByGenre(genre_id: number, page = 1, limit = 10) {
    page = Math.max(page, 1);
    limit = Math.max(limit, 1, 50);

    const offset = (page - 1) * limit;

    const [games, total] = await this.gameRepository.findAndCount({
      where: { genre_id: genre_id },
      select: ['id', 'title', 'screen_shot'],
      skip: offset,
      take: limit,
    });
    if (games.length === 0) {
      throw new NotFoundException('해당하는 장르의 게임을 찾을 수 없습니다.');
    }
    return { data: games, total: total, page: page, limit: limit, lastPage: Math.ceil(total / limit) };
  }

  // 인기 게임 id 가져오기
  async findPopularGameIds() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://store.steampowered.com/charts/topselling/KR', {
      timeout: 60000,
      waitUntil: 'networkidle0',
    });

    await page.waitForSelector('tr');
    const popularGameIds = await page.evaluate(() => {
      const idElements = Array.from(document.querySelectorAll('tbody > tr'));
      return idElements.map(element => {
        const linkElement = element.querySelector('a[href*="/app/"]');
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          const idMatch = href.match(/\/app\/(\d+)/);
          if (idMatch && idMatch.length > 1) {
            const id = idMatch[1];
            return { id };
          }
        }
      });
    });
    await browser.close();
    return popularGameIds;
  }

  // 인기 게임 저장
  @Cron('0 16 1 * * *')
  async savePopularGames() {
    await this.gameRepository.createQueryBuilder().delete().from(Game).where('is_popular = TRUE').execute();
    const popularGameIds = await this.findPopularGameIds();
    console.log('s1', popularGameIds);
    for (const appId of popularGameIds) {
      if (!appId) continue;
      try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId.id}`);
        const appData = response.data[appId.id.toString()];

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
              screen_shot: details.header_image,
              metacritic: details.metacritic?.score,
              supported_languages: details.supported_languages,
              pc_requirements: JSON.stringify(details.pc_requirements),
              release_date: new Date(details.release_date.date),
              platform: pc,
              publisher: details.publishers.join(', '),
              genre: { id: gameGenre },
              is_popular: true,
            };

            await this.gameRepository.save(gameToSave);
          }
        }
      } catch (error) {
        error;
      }
    }
  }

  // 인기순 조회
  async getPopularGames(page = 1, limit = 10) {
    page = Math.max(page, 1);
    limit = Math.max(limit, 20);
    const offset = (page - 1) * limit;
    const [popularGames, total] = await this.gameRepository.findAndCount({
      select: ['id', 'title', 'screen_shot'],
      where: { is_popular: true },
      take: limit,
      skip: offset,
    });

    if (popularGames.length === 0) {
      throw new NotFoundException('인기 게임을 찾을 수 없습니다.');
    }

    return {
      data: popularGames,
      total: total,
      page: page,
      limit: limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  // 신작 게임 id 가져오기
  async findNewGameIds() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://store.steampowered.com/search/?sort_by=Released_DESC&os=win', {
      timeout: 60000,
      waitUntil: 'networkidle2',
    });

    const gameLinks = await page.$$eval('a[href*="/app/"]', links => links.map(link => link.getAttribute('href')));

    const gameIds = gameLinks
      .map(link => {
        const match = /\/app\/(\d+)/.exec(link);
        return match ? match[1] : null;
      })
      .filter(id => id !== null);

    console.log(gameIds);

    await browser.close();
  }

  // 신작 저장
  @Cron('0 0 0 * * *')
  async saveNewGames() {
    const popularGameIds = await this.findPopularGameIds();
    for (const appId of popularGameIds) {
      if (!appId) continue;
      try {
        const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId.id}`);
        const appData = response.data[appId.id.toString()];

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
              screen_shot: details.header_image,
              metacritic: details.metacritic?.score,
              supported_languages: details.supported_languages,
              pc_requirements: JSON.stringify(details.pc_requirements),
              release_date: new Date(details.release_date.date),
              platform: pc,
              publisher: details.publishers.join(', '),
              genre: { id: gameGenre },
              is_popular: true,
            };
            await this.gameRepository.save(gameToSave);
          }
        }
      } catch (error) {
        error;
      }
    }
  }

  // 신작 조회
  async getNewGames(page = 1, limit = 10) {
    page = Math.max(page, 1);
    limit = Math.max(limit, 20);

    const offset = (page - 1) * limit;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const now = new Date();

    const totalResult = await this.gameRepository
      .createQueryBuilder('game')
      .select('COUNT(*)', 'count')
      .where('game.release_date > :oneWeekAgo', { oneWeekAgo })
      .andWhere('game.release_date < :now', { now })
      .getRawOne();

    const total = Number(totalResult.count);
    const lastPage = Math.ceil(total / limit);

    const newGames = await this.gameRepository
      .createQueryBuilder('game')
      .select(['id', 'title', 'screen_shot'])
      .where('game.release_date > :oneWeekAgo', { oneWeekAgo })
      .andWhere('game.release_date < :now', { now })
      .orderBy('game.release_date', 'DESC')
      .skip(offset)
      .take(limit)
      .getRawMany();
    return {
      data: newGames,
      page,
      limit,
      total,
      lastPage,
    };
  }

  // 게임 검색
  async searchGames(query: string) {
    const findGames = await this.gameRepository.find({
      where: { title: Like(`%${query}%`) },
    });
    return findGames;
  }
}
