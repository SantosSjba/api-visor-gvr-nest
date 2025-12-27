import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { CrearComentarioDto } from '../../dtos/issues-bim360/crear-comentario.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class CrearComentarioBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: CrearComentarioDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const data = {
            body: dto.body,
        };

        return await this.autodeskApiService.crearComentarioBim360(accessToken, projectId, issueId, data);
    }
}

