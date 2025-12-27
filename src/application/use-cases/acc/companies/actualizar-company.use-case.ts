import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarCompanyDto } from '../../../dtos/acc/companies/actualizar-company.dto';

@Injectable()
export class ActualizarCompanyUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, companyId: string, dto: ActualizarCompanyDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const updateData: Record<string, any> = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.trade !== undefined) updateData.trade = dto.trade;
        if (dto.address_line_1 !== undefined) updateData.address_line_1 = dto.address_line_1;
        if (dto.address_line_2 !== undefined) updateData.address_line_2 = dto.address_line_2;
        if (dto.city !== undefined) updateData.city = dto.city;
        if (dto.state_or_province !== undefined) updateData.state_or_province = dto.state_or_province;
        if (dto.postal_code !== undefined) updateData.postal_code = dto.postal_code;
        if (dto.country !== undefined) updateData.country = dto.country;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.website_url !== undefined) updateData.website_url = dto.website_url;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.erp_id !== undefined) updateData.erp_id = dto.erp_id;
        if (dto.tax_id !== undefined) updateData.tax_id = dto.tax_id;

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
        }

        return await this.autodeskApiService.actualizarCompany(token.access_token, accountId, companyId, updateData, dto.region);
    }
}


