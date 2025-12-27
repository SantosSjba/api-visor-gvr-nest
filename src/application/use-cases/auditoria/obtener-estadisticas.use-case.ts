import { Injectable, Inject } from '@nestjs/common';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';
import { ObtenerEstadisticasDto } from '../../dtos/auditoria/obtener-estadisticas.dto';

@Injectable()
export class ObtenerEstadisticasUseCase {
    constructor(
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(dto: ObtenerEstadisticasDto): Promise<any> {
        const estadisticas = await this.auditoriaRepository.obtenerEstadisticas(
            dto.fecha_desde || null,
            dto.fecha_hasta || null,
        );

        return estadisticas || [];
    }
}

