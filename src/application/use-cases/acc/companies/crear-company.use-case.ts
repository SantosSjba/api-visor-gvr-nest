import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearCompanyDto } from '../../../dtos/acc/companies/crear-company.dto';

@Injectable()
export class CrearCompanyUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: CrearCompanyDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const companyData: Record<string, any> = {
            name: dto.name,
            trade: dto.trade,
        };

        if (dto.address_line_1) companyData.address_line_1 = dto.address_line_1;
        if (dto.address_line_2) companyData.address_line_2 = dto.address_line_2;
        if (dto.city) companyData.city = dto.city;
        if (dto.state_or_province) companyData.state_or_province = dto.state_or_province;
        if (dto.postal_code) companyData.postal_code = dto.postal_code;
        if (dto.country) companyData.country = dto.country;
        if (dto.phone) companyData.phone = dto.phone;
        if (dto.website_url) companyData.website_url = dto.website_url;
        if (dto.description) companyData.description = dto.description;
        if (dto.erp_id) companyData.erp_id = dto.erp_id;
        if (dto.tax_id) companyData.tax_id = dto.tax_id;

        return await this.autodeskApiService.crearCompany(token.access_token, accountId, companyData, dto.region);
    }
}

