import { Module } from '@nestjs/common';
import { NotificacionesController } from '../controllers/notificaciones.controller';
import { ObtenerNotificacionesPendientesUseCase } from '../../application/use-cases/notificaciones/obtener-notificaciones-pendientes.use-case';
import { MarcarNotificacionesEntregadasUseCase } from '../../application/use-cases/notificaciones/marcar-notificaciones-entregadas.use-case';
import { NotificacionesRepository } from '../../infrastructure/repositories/notificaciones.repository';
import { NOTIFICACIONES_REPOSITORY } from '../../domain/repositories/notificaciones.repository.interface';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Module({
    controllers: [NotificacionesController],
    providers: [
        ObtenerNotificacionesPendientesUseCase,
        MarcarNotificacionesEntregadasUseCase,
        DatabaseFunctionService,
        {
            provide: NOTIFICACIONES_REPOSITORY,
            useClass: NotificacionesRepository,
        },
    ],
})
export class NotificacionesModule {}

