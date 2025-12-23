import { Injectable } from '@nestjs/common';
import { AutodeskApiService, Token2LeggedResponse } from '../../../infrastructure/services/autodesk-api.service';
import { ObtenerToken2LeggedDto } from '../../dtos/acc/obtener-token-2legged.dto';

@Injectable()
export class ObtenerToken2LeggedUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(dto: ObtenerToken2LeggedDto): Promise<Token2LeggedResponse> {
        // Default scopes if not provided
        let scopes = dto.scopes || ['data:read'];

        // Filter empty scopes
        scopes = scopes.filter(scope => scope && scope.trim() !== '');

        if (scopes.length === 0) {
            scopes = ['data:read'];
        }

        return await this.autodeskApiService.obtenerToken2Legged(scopes);
    }
}
