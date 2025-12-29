import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MenuGestionController } from '../controllers/menu-gestion.controller';
import { ListarMenusUseCase } from '../../application/use-cases/menu-gestion/listar-menus.use-case';
import { ListarMenusTreeUseCase } from '../../application/use-cases/menu-gestion/listar-menus-tree.use-case';
import { ObtenerMenuUseCase } from '../../application/use-cases/menu-gestion/obtener-menu.use-case';
import { CrearMenuUseCase } from '../../application/use-cases/menu-gestion/crear-menu.use-case';
import { EditarMenuUseCase } from '../../application/use-cases/menu-gestion/editar-menu.use-case';
import { EliminarMenuUseCase } from '../../application/use-cases/menu-gestion/eliminar-menu.use-case';
import { ListarRolesMenuUseCase } from '../../application/use-cases/menu-gestion/listar-roles-menu.use-case';
import { ListarRolesDisponiblesMenuUseCase } from '../../application/use-cases/menu-gestion/listar-roles-disponibles-menu.use-case';
import { AsignarRolMenuUseCase } from '../../application/use-cases/menu-gestion/asignar-rol-menu.use-case';
import { AsignarRolesMenuUseCase } from '../../application/use-cases/menu-gestion/asignar-roles-menu.use-case';
import { RemoverRolMenuUseCase } from '../../application/use-cases/menu-gestion/remover-rol-menu.use-case';
import { SincronizarRolesMenuUseCase } from '../../application/use-cases/menu-gestion/sincronizar-roles-menu.use-case';
import { ObtenerDetalleMenuUseCase } from '../../application/use-cases/menu-gestion/obtener-detalle-menu.use-case';
import { ListarMenuPadresDisponiblesUseCase } from '../../application/use-cases/menu-gestion/listar-menu-padres-disponibles.use-case';
import { ClonarMenuUseCase } from '../../application/use-cases/menu-gestion/clonar-menu.use-case';
import { MoverMenuUseCase } from '../../application/use-cases/menu-gestion/mover-menu.use-case';
import { ReordenarMenuUseCase } from '../../application/use-cases/menu-gestion/reordenar-menu.use-case';
import { MenuGestionRepository } from '../../infrastructure/repositories/menu-gestion.repository';
import { MENU_GESTION_REPOSITORY } from '../../domain/repositories/menu-gestion.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtStrategy } from '../../infrastructure/auth/jwt.strategy';
import { BroadcastModule } from './broadcast.module';

@Module({
    imports: [
        DatabaseModule,
        BroadcastModule,
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
    controllers: [MenuGestionController],
    providers: [
        {
            provide: MENU_GESTION_REPOSITORY,
            useClass: MenuGestionRepository,
        },
        ListarMenusUseCase,
        ListarMenusTreeUseCase,
        ObtenerMenuUseCase,
        CrearMenuUseCase,
        EditarMenuUseCase,
        EliminarMenuUseCase,
        ListarRolesMenuUseCase,
        ListarRolesDisponiblesMenuUseCase,
        AsignarRolMenuUseCase,
        AsignarRolesMenuUseCase,
        RemoverRolMenuUseCase,
        SincronizarRolesMenuUseCase,
        ObtenerDetalleMenuUseCase,
        ListarMenuPadresDisponiblesUseCase,
        ClonarMenuUseCase,
        MoverMenuUseCase,
        ReordenarMenuUseCase,
        JwtStrategy,
    ],
    exports: [MENU_GESTION_REPOSITORY],
})
export class MenuGestionModule { }
