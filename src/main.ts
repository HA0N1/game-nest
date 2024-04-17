//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SocketIoAdapter } from './utils/socketio-adapter';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'; // CorsOptions 추가

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  /**
   * useStaticAssets : 정적 파일 경로 지정
   */

  app.enableCors({
    origin: 'http://example.com',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // app.useStaticAssets(join(__dirname, '..', 'public'));
  // app.setBaseViewsDir(join(__dirname, '..', 'views'));
  // app.setViewEngine('ejs');

  app.useStaticAssets('public');
  await app.listen(3000);
}
bootstrap();
