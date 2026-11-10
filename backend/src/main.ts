import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { UPLOAD_DIR } from './upload/upload.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useBodyParser('json', { limit: '2mb' }); // CMS content is saved as one JSON document
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // reject them instead of ignoring
      transform: true,
    }),
  );
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads' });

  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();
