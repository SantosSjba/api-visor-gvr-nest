import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './presentation/modules/users.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    // Módulo de base de datos
    DatabaseModule,
    // Módulos de funcionalidad
    UsersModule,
  ],
})
export class AppModule { }

