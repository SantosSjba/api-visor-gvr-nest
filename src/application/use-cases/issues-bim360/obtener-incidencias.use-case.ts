import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ObtenerIncidenciasDto } from '../../dtos/issues-bim360/obtener-incidencias.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciasBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerIncidenciasDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const filters: Record<string, any> = {};
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.filter) filters.filter = dto.filter;

        return await this.autodeskApiService.obtenerIncidenciasBim360(accessToken, projectId, filters);
    }
}

