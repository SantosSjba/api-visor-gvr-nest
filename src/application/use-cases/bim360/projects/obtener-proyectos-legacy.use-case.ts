import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerProyectosLegacyDto } from '../../../dtos/bim360/projects/obtener-proyectos-legacy.dto';

@Injectable()
export class ObtenerProyectosLegacyUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: ObtenerProyectosLegacyDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const filters: Record<string, any> = {};
        Object.keys(dto).forEach(key => {
            if (key !== 'region' && dto[key] !== undefined) {
                filters[key] = dto[key];
            }
        });

        return await this.autodeskApiService.obtenerProyectosLegacy(token.access_token, accountId, filters, dto.region);
    }
}


