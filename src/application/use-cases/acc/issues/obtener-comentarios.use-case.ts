import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerComentariosDto } from '../../../dtos/acc/issues/obtener-comentarios.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerComentariosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: ObtenerComentariosDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        const filters: Record<string, any> = {};
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.sort) filters.sort = dto.sort;

        return await this.autodeskApiService.obtenerComentarios(accessToken, projectId, issueId, filters);
    }
}


