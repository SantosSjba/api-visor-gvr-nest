import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciaPorIdBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        return await this.autodeskApiService.obtenerIncidenciaPorIdBim360(accessToken, projectId, issueId);
    }
}


