import { Injectable, Inject } from '@nestjs/common';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';
import { ListarAuditoriasDto } from '../../dtos/auditoria/listar-auditorias.dto';

@Injectable()
export class ListarAuditoriasUseCase {
    constructor(
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(dto: ListarAuditoriasDto): Promise<any> {
        const limit = dto.limit || 20;
        const offset = dto.offset || 0;

        const listadoAuditorias = await this.auditoriaRepository.listarAuditorias(
            dto.idusuario || null,
            dto.accion || null,
            dto.entidad || null,
            dto.fecha_desde || null,
            dto.fecha_hasta || null,
            limit,
            offset,
        );

        if (!listadoAuditorias || listadoAuditorias.length === 0) {
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

        const totalRegistros = listadoAuditorias[0]?.total_registros || 0;

        return {
            data: listadoAuditorias,
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

