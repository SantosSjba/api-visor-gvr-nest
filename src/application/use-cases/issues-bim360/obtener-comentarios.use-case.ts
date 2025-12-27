import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ObtenerComentariosDto } from '../../dtos/issues-bim360/obtener-comentarios.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ObtenerComentariosBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: ObtenerComentariosDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const filters: Record<string, any> = {};
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();

        return await this.autodeskApiService.obtenerComentariosBim360(accessToken, projectId, issueId, filters);
    }
}

