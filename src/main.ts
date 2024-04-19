//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { createWorker } from '../media-soup/worker';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
    await createWorker();
    console.log('Mediasoup server initialized successfully.');
  } catch (error) {
    console.error('Error initializing Mediasoup server:', error);
  }

  await app.listen(3000);
}
bootstrap();
