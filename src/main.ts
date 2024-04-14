//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  /**
   * useStaticAssets : 정적 파일 경로 지정
   */
  app.useStaticAssets('public');

  await app.listen(3000);
}
bootstrap();
