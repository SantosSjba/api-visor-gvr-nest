import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { BuscarUsuariosProyectoDto } from '../../../dtos/acc/project-users/buscar-usuarios-proyecto.dto';

@Injectable()
export class BuscarUsuariosProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(projectId: string, dto: BuscarUsuariosProyectoDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const filters: Record<string, any> = {};
        if (dto.name) filters['filter[name]'] = dto.name;
        if (dto.email) filters['filter[email]'] = dto.email;
        if (dto.companyName) filters['filter[companyName]'] = dto.companyName;
        if (dto.filterTextMatch) filters.filterTextMatch = dto.filterTextMatch;
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();

        return await this.autodeskApiService.buscarUsuariosProyecto(
            token.access_token,
            projectId,
            filters,
            dto.region,
            dto.user_id,
        );
    }
}


