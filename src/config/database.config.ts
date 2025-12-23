import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
    logging: configService.get<boolean>('DB_LOGGING'),
    ssl: {
        rejectUnauthorized: false, // Necesario para Supabase
    },
    extra: {
        // Configuración adicional para mejorar la conexión
        connectionTimeoutMillis: 10000, // 10 segundos de timeout
        // Forzar IPv4 para evitar problemas de timeout con IPv6
        family: 4,
    },
    // Configuración de reintentos
    retryAttempts: 5,
    retryDelay: 3000,
});
