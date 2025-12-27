import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class ObtenerHistorialEntidadUseCase {
    constructor(
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(entidad: string, identidad: string): Promise<any> {
        if (!entidad || !identidad) {
            throw new BadRequestException('Entidad e identidad son requeridos');
        }

        const historial = await this.auditoriaRepository.obtenerHistorialEntidad(entidad, identidad);

        return historial || [];
    }
}

