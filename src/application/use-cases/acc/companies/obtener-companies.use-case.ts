import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerCompaniesDto } from '../../../dtos/acc/companies/obtener-companies.dto';

@Injectable()
export class ObtenerCompaniesUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: ObtenerCompaniesDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const params: Record<string, any> = {};
        if (dto.limit) params.limit = dto.limit;
        if (dto.offset) params.offset = dto.offset;
        if (dto.filter) params.filter = dto.filter;

        return await this.autodeskApiService.obtenerCompanies(token.access_token, accountId, params, dto.region);
    }
}

