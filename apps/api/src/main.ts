import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // 🔍 DEBUG: ver qué DATABASE_URL ve Render 
  const rawDbUrl = process.env.DATABASE_URL ?? 'NO_DATABASE_URL';
  console.log(
    'DATABASE_URL (debug, primeros 80 chars):',
    rawDbUrl.slice(0, 80),
  );

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // ⚠️ En Render SIEMPRE usa process.env.PORT
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
}

bootstrap(); 
