import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { BuscarCompaniesDto } from '../../../dtos/acc/companies/buscar-companies.dto';

@Injectable()
export class BuscarCompaniesUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: BuscarCompaniesDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const params: Record<string, any> = {};
        if (dto.limit) params.limit = dto.limit;
        if (dto.offset) params.offset = dto.offset;

        return await this.autodeskApiService.buscarCompanies(token.access_token, accountId, dto.term, params, dto.region);
    }
}

