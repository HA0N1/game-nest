import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { IoAdapter } from '@nestjs/platform-socket.io';
// import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface'; // CorsOptions 추가

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3000);
}
bootstrap();
