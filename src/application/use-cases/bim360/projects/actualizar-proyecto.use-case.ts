import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarProyectoBim360Dto } from '../../../dtos/bim360/projects/actualizar-proyecto.dto';

@Injectable()
export class ActualizarProyectoBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, projectId: string, dto: ActualizarProyectoBim360Dto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const updateData: Record<string, any> = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.start_date !== undefined) updateData.start_date = dto.start_date;
        if (dto.end_date !== undefined) updateData.end_date = dto.end_date;
        if (dto.project_type !== undefined) updateData.project_type = dto.project_type;
        if (dto.value !== undefined) updateData.value = dto.value;
        if (dto.currency !== undefined) updateData.currency = dto.currency;
        if (dto.job_number !== undefined) updateData.job_number = dto.job_number;
        if (dto.address_line_1 !== undefined) updateData.address_line_1 = dto.address_line_1;
        if (dto.city !== undefined) updateData.city = dto.city;
        if (dto.state_or_province !== undefined) updateData.state_or_province = dto.state_or_province;
        if (dto.postal_code !== undefined) updateData.postal_code = dto.postal_code;
        if (dto.country !== undefined) updateData.country = dto.country;
        if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
        if (dto.language !== undefined) updateData.language = dto.language;
        if (dto.construction_type !== undefined) updateData.construction_type = dto.construction_type;
        if (dto.contract_type !== undefined) updateData.contract_type = dto.contract_type;

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
        }

        return await this.autodeskApiService.actualizarProyectoBim360(token.access_token, accountId, projectId, updateData, dto.region);
    }
}


