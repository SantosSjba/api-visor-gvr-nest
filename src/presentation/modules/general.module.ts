import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeneralController } from '../controllers/general.controller';
import { ListarMenuOpcionesUseCase } from '../../application/use-cases/general/listar-menu-opciones.use-case';
import { ObtenerMenuOpcionUseCase } from '../../application/use-cases/general/obtener-menu-opcion.use-case';
import { ObtenerOpcionesListaUseCase } from '../../application/use-cases/general/obtener-opciones-lista.use-case';
import { ListarMenuRecursivoUseCase } from '../../application/use-cases/general/listar-menu-recursivo.use-case';
import { MenuRepository } from '../../infrastructure/repositories/menu.repository';
import { MENU_REPOSITORY } from '../../domain/repositories/menu.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtStrategy } from '../../infrastructure/auth/jwt.strategy';

@Module({
    imports: [
        DatabaseModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production',
                signOptions: {
                    expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [GeneralController],
    providers: [
        // Repositories
        {
            provide: MENU_REPOSITORY,
            useClass: MenuRepository,
        },
        // Use cases
        ListarMenuOpcionesUseCase,
        ObtenerMenuOpcionUseCase,
        ObtenerOpcionesListaUseCase,
        ListarMenuRecursivoUseCase,
        // JWT Strategy
        JwtStrategy,
    ],
    exports: [MENU_REPOSITORY],
})
export class GeneralModule { }
