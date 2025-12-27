import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerUrlMiniaturaDto } from '../../../dtos/acc/issues/obtener-url-miniatura.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerUrlMiniaturaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerUrlMiniaturaDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        return await this.autodeskApiService.obtenerUrlMiniatura(accessToken, dto.snapshotUrn);
    }
}

