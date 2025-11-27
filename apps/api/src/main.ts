import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT || 3000);
  console.log(`API running on http://localhost:${process.env.PORT || 3000}/api/v1`);
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const rawDbUrl = process.env.DATABASE_URL ?? 'NO_DATABASE_URL';
  console.log('DATABASE_URL (debug, primeros 80 chars):', rawDbUrl.slice(0, 80));

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  // INFO opcional para confirmar puerto:
  // eslint-disable-next-line no-console
  console.log(`API running on http://192.168.100.29:${port}/api/v1`);

  
}

bootstrap();
