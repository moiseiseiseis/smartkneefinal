import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Prefijo global de la API
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  // ==== CORS ====
  // En dev: localhost:3000 (Next)
  // En prod: tu dominio de Vercel (ajústalo cuando lo tengas)
  const allowedOrigins = [
    'http://localhost:3000',
    'https://smartkneefinal.onrender.com', // por si algún día llamas directo desde navegador
    // 'https://TU-PORTAL.vercel.app',      // <- cuando tengas el dominio de Vercel, lo agregas aquí
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir también requests sin origin (curl, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} no permitido por CORS`), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  const port = process.env.PORT || 3000;

  await app.listen(port);

  console.log(`API running on http://localhost:${port}/${globalPrefix}`);
}
bootstrap();
