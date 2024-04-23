import { Controller, Get } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('offline')
  async findGameShop() {
    return this.storeService.findGameShop();
  }
  @Get('offline/PS')
  async findPsShop() {
    return this.storeService.findPsShop();
  }
}
