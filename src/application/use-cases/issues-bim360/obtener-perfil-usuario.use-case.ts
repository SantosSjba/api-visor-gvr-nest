import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ObtenerPerfilUsuarioBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        return await this.autodeskApiService.obtenerPerfilUsuarioBim360(accessToken, projectId);
    }
}

