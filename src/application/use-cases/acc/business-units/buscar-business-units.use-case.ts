import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { BuscarBusinessUnitsDto } from '../../../dtos/acc/business-units/buscar-business-units.dto';

@Injectable()
export class BuscarBusinessUnitsUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: BuscarBusinessUnitsDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.buscarBusinessUnits(token.access_token, accountId, dto.term, dto.region);
    }
}

