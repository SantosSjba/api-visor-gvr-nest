import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearComentarioDto } from '../../../dtos/acc/issues/crear-comentario.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class CrearComentarioUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: CrearComentarioDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        const data = {
            comment: dto.comment,
        };

        return await this.autodeskApiService.crearComentario(accessToken, projectId, issueId, data);
    }
}


