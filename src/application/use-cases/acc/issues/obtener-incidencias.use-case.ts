import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerIncidenciasDto } from '../../../dtos/acc/issues/obtener-incidencias.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciasUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerIncidenciasDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        const filters: Record<string, any> = {};
        if (dto.filter_status) filters['filter[status]'] = dto.filter_status;
        if (dto.filter_assignedTo) filters['filter[assignedTo]'] = dto.filter_assignedTo;
        if (dto.filter_issueTypeId) filters['filter[issueTypeId]'] = dto.filter_issueTypeId;
        if (dto.filter_rootCauseId) filters['filter[rootCauseId]'] = dto.filter_rootCauseId;
        if (dto.filter_locationId) filters['filter[locationId]'] = dto.filter_locationId;
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.sort) filters.sort = dto.sort;

        return await this.autodeskApiService.obtenerIncidencias(accessToken, projectId, filters);
    }
}


