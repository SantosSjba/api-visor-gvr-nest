import { webcrypto } from 'crypto';

// Polyfill para crypto.randomUUID() - debe estar ANTES de cualquier otra importación de NestJS
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Main.ts');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar validación global
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: false, // Cambiado a false para compatibilidad con Easy Panel
      transform: true, // Transforma los payloads a instancias de DTO
    }),
  );

  // Configurar interceptor de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Configurar filtro global de excepciones
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configurar CORS
  const frontendUrls = configService.get<string>('FRONTEND_URLS');
  app.enableCors({
    origin: frontendUrls ? frontendUrls.split(',') : true, // Soporta múltiples URLs separadas por coma
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://0.0.0.0:${port}/api`);
  logger.log(`📊 Database: ${configService.get<string>('DB_HOST')}`);
}
bootstrap();