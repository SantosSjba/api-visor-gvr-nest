import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolController } from '../controllers/rol.controller';
import { ListarRolesUseCase } from '../../application/use-cases/rol/listar-roles.use-case';
import { ListarRolesForListUseCase } from '../../application/use-cases/rol/listar-roles-for-list.use-case';
import { ObtenerRolUseCase } from '../../application/use-cases/rol/obtener-rol.use-case';
import { CrearRolUseCase } from '../../application/use-cases/rol/crear-rol.use-case';
import { EditarRolUseCase } from '../../application/use-cases/rol/editar-rol.use-case';
import { EliminarRolUseCase } from '../../application/use-cases/rol/eliminar-rol.use-case';
import { ListarPermisosRolUseCase } from '../../application/use-cases/rol/listar-permisos-rol.use-case';
import { ListarPermisosDisponiblesUseCase } from '../../application/use-cases/rol/listar-permisos-disponibles.use-case';
import { AsignarPermisoRolUseCase } from '../../application/use-cases/rol/asignar-permiso-rol.use-case';
import { AsignarPermisosRolUseCase } from '../../application/use-cases/rol/asignar-permisos-rol.use-case';
import { RemoverPermisoRolUseCase } from '../../application/use-cases/rol/remover-permiso-rol.use-case';
import { SincronizarPermisosRolUseCase } from '../../application/use-cases/rol/sincronizar-permisos-rol.use-case';
import { ObtenerDetalleRolUseCase } from '../../application/use-cases/rol/obtener-detalle-rol.use-case';
import { GestionarRolesUsuarioUseCase } from '../../application/use-cases/rol/gestionar-roles-usuario.use-case';
import { RolRepository } from '../../infrastructure/repositories/rol.repository';
import { ROL_REPOSITORY } from '../../domain/repositories/rol.repository.interface';
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
    controllers: [RolController],
    providers: [
        {
            provide: ROL_REPOSITORY,
            useClass: RolRepository,
        },
        ListarRolesUseCase,
        ListarRolesForListUseCase,
        ObtenerRolUseCase,
        CrearRolUseCase,
        EditarRolUseCase,
        EliminarRolUseCase,
        ListarPermisosRolUseCase,
        ListarPermisosDisponiblesUseCase,
        AsignarPermisoRolUseCase,
        AsignarPermisosRolUseCase,
        RemoverPermisoRolUseCase,
        SincronizarPermisosRolUseCase,
        ObtenerDetalleRolUseCase,
        GestionarRolesUsuarioUseCase,
        JwtStrategy,
    ],
    exports: [ROL_REPOSITORY],
})
export class RolModule { }
