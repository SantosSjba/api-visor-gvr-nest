import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PermisoController } from '../controllers/permiso.controller';
import { ListarPermisosUseCase } from '../../application/use-cases/permiso/listar-permisos.use-case';
import { ObtenerPermisoUseCase } from '../../application/use-cases/permiso/obtener-permiso.use-case';
import { CrearPermisoUseCase } from '../../application/use-cases/permiso/crear-permiso.use-case';
import { EditarPermisoUseCase } from '../../application/use-cases/permiso/editar-permiso.use-case';
import { EliminarPermisoUseCase } from '../../application/use-cases/permiso/eliminar-permiso.use-case';
import { PermisoRepository } from '../../infrastructure/repositories/permiso.repository';
import { PERMISO_REPOSITORY } from '../../domain/repositories/permiso.repository.interface';
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
    controllers: [PermisoController],
    providers: [
        {
            provide: PERMISO_REPOSITORY,
            useClass: PermisoRepository,
        },
        ListarPermisosUseCase,
        ObtenerPermisoUseCase,
        CrearPermisoUseCase,
        EditarPermisoUseCase,
        EliminarPermisoUseCase,
        JwtStrategy,
    ],
    exports: [PERMISO_REPOSITORY],
})
export class PermisoModule { }
