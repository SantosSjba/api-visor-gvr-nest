import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerAdjuntosDto } from '../../../dtos/acc/issues/obtener-adjuntos.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerAdjuntosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: ObtenerAdjuntosDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        const filters: Record<string, any> = {};
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.sort) filters.sort = dto.sort;

        return await this.autodeskApiService.obtenerAdjuntos(accessToken, projectId, issueId, filters);
    }
}


