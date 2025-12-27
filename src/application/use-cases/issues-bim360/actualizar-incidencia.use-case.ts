import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ActualizarIncidenciaDto } from '../../dtos/issues-bim360/actualizar-incidencia.dto';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ActualizarIncidenciaBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: ActualizarIncidenciaDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        const updateData: Record<string, any> = {};
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.issueSubtypeId !== undefined) updateData.issueSubtypeId = dto.issueSubtypeId;
        if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate;
        if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
        if (dto.assignedToType !== undefined) updateData.assignedToType = dto.assignedToType;
        if (dto.rootCauseId !== undefined) updateData.rootCauseId = dto.rootCauseId;
        if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
        if (dto.locationId !== undefined) updateData.locationId = dto.locationId;
        if (dto.locationDetails !== undefined) updateData.locationDetails = dto.locationDetails;

        return await this.autodeskApiService.actualizarIncidenciaBim360(accessToken, projectId, issueId, updateData);
    }
}


