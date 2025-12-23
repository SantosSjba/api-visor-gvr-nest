import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../controllers/auth.controller';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [
        DatabaseModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production',
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1d',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        // Repository
        {
            provide: AUTH_REPOSITORY,
            useClass: AuthRepository,
        },
        // Use cases
        RegisterUseCase,
        LoginUseCase,
    ],
    exports: [AUTH_REPOSITORY, JwtModule],
})
export class AuthModule { }
