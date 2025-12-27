import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerUsuariosProyectoDto } from '../../../dtos/acc/project-users/obtener-usuarios-proyecto.dto';

@Injectable()
export class ObtenerUsuariosProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(projectId: string, dto: ObtenerUsuariosProyectoDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const filters: Record<string, any> = {};
        if (dto.filter) {
            Object.entries(dto.filter).forEach(([key, value]) => {
                filters[`filter[${key}]`] = String(value);
            });
        }
        if (dto.sort) {
            filters.sort = Array.isArray(dto.sort) ? dto.sort.join(',') : dto.sort;
        }
        if (dto.fields) {
            filters.fields = Array.isArray(dto.fields) ? dto.fields.join(',') : dto.fields;
        }
        if (dto.orFilters) {
            filters.orFilters = Array.isArray(dto.orFilters) ? dto.orFilters.join(',') : dto.orFilters;
        }
        if (dto.filterTextMatch) filters.filterTextMatch = dto.filterTextMatch;
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();

        return await this.autodeskApiService.obtenerUsuariosProyecto(
            token.access_token,
            projectId,
            filters,
            dto.region,
            dto.user_id,
        );
    }
}


