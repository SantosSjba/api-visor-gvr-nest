import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarImagenProyectoBim360Dto } from '../../../dtos/bim360/projects/actualizar-imagen-proyecto.dto';

@Injectable()
export class ActualizarImagenProyectoBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, projectId: string, dto: ActualizarImagenProyectoBim360Dto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.actualizarImagenProyectoBim360(
            token.access_token,
            accountId,
            projectId,
            dto.image,
            dto.region,
        );
    }
}

