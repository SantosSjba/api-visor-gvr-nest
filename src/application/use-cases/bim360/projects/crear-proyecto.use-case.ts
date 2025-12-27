import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearProyectoBim360Dto } from '../../../dtos/bim360/projects/crear-proyecto.dto';

@Injectable()
export class CrearProyectoBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: CrearProyectoBim360Dto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const projectData: Record<string, any> = {
            name: dto.name,
            start_date: dto.start_date,
            end_date: dto.end_date,
            project_type: dto.project_type,
            value: dto.value,
            currency: dto.currency,
        };

        if (dto.job_number) projectData.job_number = dto.job_number;
        if (dto.address_line_1) projectData.address_line_1 = dto.address_line_1;
        if (dto.city) projectData.city = dto.city;
        if (dto.state_or_province) projectData.state_or_province = dto.state_or_province;
        if (dto.postal_code) projectData.postal_code = dto.postal_code;
        if (dto.country) projectData.country = dto.country;
        if (dto.timezone) projectData.timezone = dto.timezone;
        if (dto.language) projectData.language = dto.language;
        if (dto.construction_type) projectData.construction_type = dto.construction_type;
        if (dto.contract_type) projectData.contract_type = dto.contract_type;
        if (dto.template_project_id) projectData.template_project_id = dto.template_project_id;
        if (dto.include_locations !== undefined) projectData.include_locations = dto.include_locations;
        if (dto.include_companies !== undefined) projectData.include_companies = dto.include_companies;

        return await this.autodeskApiService.crearProyectoBim360(token.access_token, accountId, projectData, dto.region);
    }
}


