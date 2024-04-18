import { Controller, Get, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get('test')
  @Render('test')
  getTestPage() {
    return { message: 'HI' };
  }
}
