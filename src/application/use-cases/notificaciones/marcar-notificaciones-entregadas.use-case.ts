import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICACIONES_REPOSITORY } from '../../../domain/repositories/notificaciones.repository.interface';
import type { INotificacionesRepository } from '../../../domain/repositories/notificaciones.repository.interface';

@Injectable()
export class MarcarNotificacionesEntregadasUseCase {
    constructor(
        @Inject(NOTIFICACIONES_REPOSITORY)
        private readonly notificacionesRepository: INotificacionesRepository,
    ) {}

    async execute(userId: number): Promise<void> {
        await this.notificacionesRepository.marcarTodasComoEntregadas(userId);
    }
}

