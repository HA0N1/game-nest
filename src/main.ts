//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { createWorker } from '../media-soup/worker';

import { SocketIoAdapter } from './utils/socketio-adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useWebSocketAdapter(new SocketIoAdapter(app));
  /**
   * useStaticAssets : 정적 파일 경로 지정
   */

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));

  app.set('view engine', 'hbs');

  try {
    const { worker } = await createWorker();
    console.log('bootstrap ~ worker:', worker);
    console.log('Mediasoup server initialized successfully.');
  } catch (error) {
    console.error('Error initializing Mediasoup server:', error);
  }

  await app.listen(3000);
}
bootstrap();
