import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarProyectoDto } from '../../../dtos/acc/projects/actualizar-proyecto.dto';

@Injectable()
export class ActualizarProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, projectId: string, dto: ActualizarProyectoDto, userId?: string): Promise<any> {
        const projectData: Record<string, any> = {};

        if (dto.name) projectData.name = dto.name;
        if (dto.startDate) projectData.startDate = dto.startDate;
        if (dto.endDate) projectData.endDate = dto.endDate;
        if (dto.type) projectData.type = dto.type;
        if (dto.classification) projectData.classification = dto.classification;
        if (dto.jobNumber) projectData.jobNumber = dto.jobNumber;
        if (dto.addressLine1) projectData.addressLine1 = dto.addressLine1;
        if (dto.addressLine2) projectData.addressLine2 = dto.addressLine2;
        if (dto.city) projectData.city = dto.city;
        if (dto.stateOrProvince) projectData.stateOrProvince = dto.stateOrProvince;
        if (dto.postalCode) projectData.postalCode = dto.postalCode;
        if (dto.country) projectData.country = dto.country;
        if (dto.latitude) projectData.latitude = dto.latitude;
        if (dto.longitude) projectData.longitude = dto.longitude;
        if (dto.timezone) projectData.timezone = dto.timezone;
        if (dto.constructionType) projectData.constructionType = dto.constructionType;
        if (dto.deliveryMethod) projectData.deliveryMethod = dto.deliveryMethod;
        if (dto.contractType) projectData.contractType = dto.contractType;
        if (dto.currentPhase) projectData.currentPhase = dto.currentPhase;
        if (dto.businessUnitId) projectData.businessUnitId = dto.businessUnitId;
        if (dto.projectValue) projectData.projectValue = dto.projectValue;

        if (Object.keys(projectData).length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
        }

        return await this.autodeskApiService.updateAccProject(
            accountId,
            projectId,
            projectData,
            dto.token,
            userId,
        );
    }
}
