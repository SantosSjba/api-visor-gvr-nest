import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerProyectosNewDto } from '../../../dtos/bim360/projects/obtener-proyectos-new.dto';

@Injectable()
export class ObtenerProyectosNewUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: ObtenerProyectosNewDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const filters: Record<string, any> = {};
        Object.keys(dto).forEach(key => {
            if (dto[key] !== undefined) {
                filters[key] = dto[key];
            }
        });

        return await this.autodeskApiService.obtenerProyectosNew(token.access_token, accountId, filters);
    }
}

