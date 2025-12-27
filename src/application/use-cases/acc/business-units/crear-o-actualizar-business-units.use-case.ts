import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearOActualizarBusinessUnitsDto } from '../../../dtos/acc/business-units/crear-o-actualizar-business-units.dto';

@Injectable()
export class CrearOActualizarBusinessUnitsUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: CrearOActualizarBusinessUnitsDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.crearOActualizarBusinessUnits(
            token.access_token,
            accountId,
            dto.business_units,
            dto.region,
        );
    }
}

