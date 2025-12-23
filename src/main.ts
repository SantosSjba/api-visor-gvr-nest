import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
      transform: true, // Transforma los payloads a instancias de DTO
    }),
  );

  // Configurar filtro global de excepciones
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configurar CORS
  app.enableCors({
    origin: true, // En producción, especifica los orígenes permitidos
    credentials: true,
  });

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📊 Database: ${process.env.DB_HOST}`);
}
bootstrap();

