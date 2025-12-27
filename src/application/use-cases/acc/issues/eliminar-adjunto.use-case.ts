import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class EliminarAdjuntoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, attachmentId: string): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        return await this.autodeskApiService.eliminarAdjunto(accessToken, projectId, issueId, attachmentId);
    }
}


