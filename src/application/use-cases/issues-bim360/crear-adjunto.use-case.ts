import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { CrearAdjuntoDto } from '../../dtos/issues-bim360/crear-adjunto.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class CrearAdjuntoBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: CrearAdjuntoDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const data: Record<string, any> = {};
        if (dto.urn) data.urn = dto.urn;
        if (dto.name) data.name = dto.name;
        if (dto.fileName) data.fileName = dto.fileName;
        if (dto.displayName) data.displayName = dto.displayName;
        if (dto.type) data.type = dto.type;
        if (dto.data) data.data = dto.data;

        return await this.autodeskApiService.crearAdjuntoBim360(accessToken, projectId, issueId, data);
    }
}


