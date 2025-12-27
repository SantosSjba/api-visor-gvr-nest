import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';

@Injectable()
export class EliminarUsuarioProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(projectId: string, projectUserId: string, region?: string, userId?: string): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.eliminarUsuarioProyecto(
            token.access_token,
            projectId,
            projectUserId,
            region,
            userId,
        );
    }
}

