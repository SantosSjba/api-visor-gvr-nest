import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { CrearIncidenciaDto } from '../../dtos/issues-bim360/crear-incidencia.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class CrearIncidenciaBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, dto: CrearIncidenciaDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const data: Record<string, any> = {
            title: dto.title,
        };

        if (dto.description) data.description = dto.description;
        if (dto.status) data.status = dto.status;
        if (dto.issueSubtypeId) data.issueSubtypeId = dto.issueSubtypeId;
        if (dto.dueDate) data.dueDate = dto.dueDate;
        if (dto.assignedTo) data.assignedTo = dto.assignedTo;
        if (dto.assignedToType) data.assignedToType = dto.assignedToType;
        if (dto.rootCauseId) data.rootCauseId = dto.rootCauseId;
        if (dto.startDate) data.startDate = dto.startDate;
        if (dto.locationId) data.locationId = dto.locationId;
        if (dto.locationDetails) data.locationDetails = dto.locationDetails;
        if (dto.linkedDocuments) data.linkedDocuments = dto.linkedDocuments;

        return await this.autodeskApiService.crearIncidenciaBim360(accessToken, projectId, data);
    }
}

