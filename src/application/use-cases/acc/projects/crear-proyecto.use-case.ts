import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearProyectoDto } from '../../../dtos/acc/projects/crear-proyecto.dto';

@Injectable()
export class CrearProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: CrearProyectoDto, userId?: string): Promise<any> {
        const projectData: Record<string, any> = {
            name: dto.name,
            type: dto.type,
        };

        if (dto.classification) projectData.classification = dto.classification;
        if (dto.startDate) projectData.startDate = dto.startDate;
        if (dto.endDate) projectData.endDate = dto.endDate;
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

        return await this.autodeskApiService.createAccProject(
            accountId,
            projectData,
            dto.token,
            userId,
        );
    }
}
