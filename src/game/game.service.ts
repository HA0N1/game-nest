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
    limit = Math.max(limit, 1);

    const offset = (page - 1) * limit;

    const [games, total] = await this.gameRepository.findAndCount({
      where: { genre_id: genre_id },
      select: ['title', 'screen_shot'],
      skip: offset,
      take: limit,
    });
    if (games.length === 0) {
      throw new NotFoundException('해당하는 장르의 게임을 찾을 수 없습니다.');
    }
    return { data: games, total: total, page: page, lastPage: Math.ceil(total / limit) };
  }

  // 인기순 저장
  @Cron('0 16 1 * * *')
  async savePopularGames() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://store.steampowered.com/charts/topselling/KR', {
      timeout: 60000,
      waitUntil: 'networkidle0',
    });

    await page.waitForSelector('tr');
    const popularGames = await page.evaluate(() => {
      const gameElements = Array.from(document.querySelectorAll('tbody > tr'));
      return gameElements.map(element => {
        const rank = parseInt(element.querySelector('._34h48M_x9S-9Q2FFPX_CcU').textContent);
        const imageElement = element.querySelector('img._2dODJrHKWs6F9v9QpgzihO');
        const screen_shot = imageElement ? imageElement.getAttribute('src') : '이미지 정보 없음';
        const title = element.querySelector('._1n_4-zvf0n4aqGEksbgW9N').textContent;
        const price = element.querySelector('.Wh0L8EnwsPV_8VAu8TOYr')?.textContent ?? '가격 정보 없음';
        const change = element.querySelector('._2OA1JW-4H-f01kM7myTUuu.Focusable').textContent ?? '변동 정보 없음';

        return { rank, screen_shot, title, price, change };
      });
    });
    await browser.close();

    await this.gameRepository.createQueryBuilder().delete().from(Game).where('change IS NOT NULL').execute();

    await this.gameRepository.save(popularGames);

    return { message: '인기 게임 저장 완료' };
  }

  // 인기순 조회
  async getPopularGames(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [popularGames, total] = await this.gameRepository.findAndCount({
      select: ['rank', 'screen_shot', 'title', 'price', 'change'],
      where: {
        change: Not(IsNull()),
      },
      order: {
        rank: 'ASC',
      },
      take: limit,
      skip: offset,
    });

    if (popularGames.length === 0) {
      throw new NotFoundException('인기 게임을 찾을 수 없습니다.');
    }

    return {
      data: popularGames,
      count: total,
      page: page,
      limit: limit,
    };
  }

  // 신작 저장
  @Cron('0 0 0 * * *')
  async saveNewGames() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://store.steampowered.com/search/?sort_by=Released_DESC&os=win', {
      waitUntil: 'networkidle2',
    });

    const newGames = await page.evaluate(() => {
      const items = document.querySelectorAll('.search_result_row');
      return Array.from(items).map(item => {
        const title = item.querySelector('.title').textContent;
        const imageElement = item.querySelector('.col.search_capsule img');
        const screen_shot = imageElement.getAttribute('src');
        const release_date = item.querySelector('.search_released').textContent;
        const price = item.querySelector('.discount_final_price').textContent;
        return { title, release_date, price, screen_shot };
      });
    });
    await browser.close();

    function parseDate(dateString) {
      return new Date(Date.parse(dateString));
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const gamesToSave = newGames.filter(game => {
      const gameReleaseDate = parseDate(game.release_date);
      return gameReleaseDate > oneWeekAgo;
    });

    await Promise.all(
      gamesToSave.map(async game => {
        const existingGame = await this.gameRepository.findOne({
          where: {
            title: game.title,
            release_date: parseDate(game.release_date),
          },
        });
        if (!existingGame) {
          await this.gameRepository.save(game);
        }
      }),
    );

    return { message: '신작 게임 저장 완료' };
  }

  // 신작 조회
  async getNewGames(page: number, limit: number) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const now = new Date();

    const total = await this.gameRepository
      .createQueryBuilder('game')
      .select('COUNT(*)', 'count')
      .where('game.release_date > :oneWeekAgo', { oneWeekAgo })
      .andWhere('game.release_date < :now', { now })
      .andWhere('game.developer IS NULL')
      .getRawOne();

    const offset = (pageNumber - 1) * limitNumber;

    const newGames = await this.gameRepository
      .createQueryBuilder('game')
      .select(['title', 'screen_shot', 'release_date', 'price'])
      .where('game.release_date > :oneWeekAgo', { oneWeekAgo })
      .andWhere('game.release_date < :now', { now })
      .andWhere('game.developer IS NULL')
      .orderBy('game.release_date', 'DESC')
      .offset(offset)
      .take(limit)
      .getRawMany();

    return {
      data: newGames,
      page,
      limit,
      total: parseInt(total.count, 10),
    };
  }

  // 게임 검색
  async searchGames(query: string) {
    return this.gameRepository.find({
      where: { title: Like(`%${query}`) },
    });
  }
}
