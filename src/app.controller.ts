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
  @Get('login')
  getLoginPage(@Res() res: Response) {
    const staticPath = this.configService.get<string>('STATIC_FILES_PATH');
    const filePath = join(process.cwd(), 'dist', staticPath, 'login.html');
    res.sendFile(filePath);
  }

  @Get('chat')
  getChatPage(@Res() res: Response) {
    const staticPath = this.configService.get<string>('STATIC_FILES_PATH');
    const filePath = join(process.cwd(), 'dist', staticPath, 'chat.html');
    res.sendFile(filePath);
  }
}
