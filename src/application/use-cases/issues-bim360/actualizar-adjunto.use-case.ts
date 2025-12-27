import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ActualizarAdjuntoDto } from '../../dtos/issues-bim360/actualizar-adjunto.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ActualizarAdjuntoBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, attachmentId: string, dto: ActualizarAdjuntoDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const data: Record<string, any> = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.displayName !== undefined) data.displayName = dto.displayName;
        if (dto.data !== undefined) data.data = dto.data;

        return await this.autodeskApiService.actualizarAdjuntoBim360(accessToken, projectId, issueId, attachmentId, data);
    }
}


