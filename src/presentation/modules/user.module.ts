import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserController } from '../controllers/user.controller';
import { ActualizarCredencialesUseCase } from '../../application/use-cases/auth/actualizar-credenciales.use-case';
import { ObtenerPerfilUsuarioUseCase } from '../../application/use-cases/auth/obtener-perfil-usuario.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
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
    controllers: [UserController],
    providers: [
        // Repositories
        {
            provide: AUTH_REPOSITORY,
            useClass: AuthRepository,
        },
        // Use cases
        ActualizarCredencialesUseCase,
        ObtenerPerfilUsuarioUseCase,
        // JWT Strategy
        JwtStrategy,
    ],
    exports: [AUTH_REPOSITORY],
})
export class UserModule { }
