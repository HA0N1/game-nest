import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
@Injectable()
export class StoreService {
  //스위치 게임샵 조회
  async findGameShop() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.nintendo.co.kr/support/switch/officialstore/');

    await page.waitForSelector('td');

    const data = await page.evaluate(() => {
      const dataList = [];
      document.querySelectorAll('td').forEach(td => {
        const text = td.textContent;
        const link = td.querySelector('a')?.getAttribute('href');
        dataList.push({ text, link });
      });
      return dataList;
    });

    await browser.close();

    return { data };
  }

  //오프라인 플스 판매점 조회
  async findPsShop() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.playstation.com/ko-kr/local/campaigns/watcha/shop-list/');

    await page.waitForSelector('td');

    const data = await page.evaluate(() => {
      const dataList = [];
      document.querySelectorAll('td').forEach(td => {
        const text = td.textContent;
        dataList.push({ text });
      });
      return dataList;
    });

    await browser.close();

    return { data };
  }
}
