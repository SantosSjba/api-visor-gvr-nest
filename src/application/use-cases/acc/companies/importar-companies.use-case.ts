import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ImportarCompaniesDto } from '../../../dtos/acc/companies/importar-companies.dto';

@Injectable()
export class ImportarCompaniesUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: ImportarCompaniesDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.importarCompanies(token.access_token, accountId, dto.companies, dto.region);
    }
}


