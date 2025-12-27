import { Injectable, Inject } from '@nestjs/common';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';
import { ObtenerHistorialUsuarioDto } from '../../dtos/auditoria/obtener-historial-usuario.dto';

@Injectable()
export class ObtenerHistorialUsuarioUseCase {
    constructor(
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(idUsuario: number, dto: ObtenerHistorialUsuarioDto): Promise<any> {
        const limit = dto.limit || 20;
        const offset = dto.offset || 0;

        const historial = await this.auditoriaRepository.obtenerHistorialUsuario(idUsuario, limit, offset);

        if (!historial || historial.length === 0) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    limit,
                    offset,
                    total_pages: 0,
                    current_page: 1,
                },
            };
        }

        const totalRegistros = historial[0]?.total_registros || 0;

        return {
            data: historial,
            pagination: {
                total: Number(totalRegistros),
                limit,
                offset,
                total_pages: limit > 0 ? Math.ceil(Number(totalRegistros) / limit) : 0,
                current_page: limit > 0 ? Math.floor(offset / limit) + 1 : 1,
            },
        };
    }
}

