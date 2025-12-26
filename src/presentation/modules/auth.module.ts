import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../controllers/auth.controller';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case';
import { ObtenerPerfilUseCase } from '../../application/use-cases/auth/obtener-perfil.use-case';
import { ValidarSesionUseCase } from '../../application/use-cases/auth/validar-sesion.use-case';
import { CerrarTodasSesionesUseCase } from '../../application/use-cases/auth/cerrar-todas-sesiones.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { SesionRepository } from '../../infrastructure/repositories/sesion.repository';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import { SESION_REPOSITORY } from '../../domain/repositories/sesion.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtStrategy } from '../../infrastructure/auth/jwt.strategy';

@Module({
    imports: [
        DatabaseModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production',
                signOptions: {
                    expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        // Repositories
        {
            provide: AUTH_REPOSITORY,
            useClass: AuthRepository,
        },
        {
            provide: SESION_REPOSITORY,
            useClass: SesionRepository,
        },
        // Use cases
        RegisterUseCase,
        LoginUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
        ObtenerPerfilUseCase,
        ValidarSesionUseCase,
        CerrarTodasSesionesUseCase,
        // JWT Strategy
        JwtStrategy,
    ],
    exports: [AUTH_REPOSITORY, SESION_REPOSITORY, JwtModule],
})
export class AuthModule { }
