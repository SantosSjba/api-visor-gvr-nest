import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerBusinessUnitsHijasDto } from '../../../dtos/acc/business-units/obtener-business-units-hijas.dto';

@Injectable()
export class ObtenerBusinessUnitsHijasUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: ObtenerBusinessUnitsHijasDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.obtenerBusinessUnitsHijas(token.access_token, accountId, dto.parent_id, dto.region);
    }
}

