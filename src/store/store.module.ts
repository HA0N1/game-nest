import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { APP_FILTER } from '@nestjs/core';
import { TokenExpiredFilter } from 'src/auth/guard/exception.filter';

@Module({
  controllers: [StoreController],
  providers: [StoreService, { provide: APP_FILTER, useClass: TokenExpiredFilter }],
})
export class StoreModule {}
