import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmpresaController } from '../controllers/empresa.controller';
import { ListarEmpresasUseCase } from '../../application/use-cases/empresa/listar-empresas.use-case';
import { ObtenerEmpresaUseCase } from '../../application/use-cases/empresa/obtener-empresa.use-case';
import { CrearEmpresaUseCase } from '../../application/use-cases/empresa/crear-empresa.use-case';
import { EditarEmpresaUseCase } from '../../application/use-cases/empresa/editar-empresa.use-case';
import { EliminarEmpresaUseCase } from '../../application/use-cases/empresa/eliminar-empresa.use-case';
import { EmpresaRepository } from '../../infrastructure/repositories/empresa.repository';
import { EMPRESA_REPOSITORY } from '../../domain/repositories/empresa.repository.interface';
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
    controllers: [EmpresaController],
    providers: [
        // Repositories
        {
            provide: EMPRESA_REPOSITORY,
            useClass: EmpresaRepository,
        },
        // Use cases
        ListarEmpresasUseCase,
        ObtenerEmpresaUseCase,
        CrearEmpresaUseCase,
        EditarEmpresaUseCase,
        EliminarEmpresaUseCase,
        // JWT Strategy
        JwtStrategy,
    ],
    exports: [EMPRESA_REPOSITORY],
})
export class EmpresaModule { }
