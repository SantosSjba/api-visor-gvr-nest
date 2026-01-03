import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarIncidenciaDto } from '../../../dtos/acc/issues/actualizar-incidencia.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ActualizarIncidenciaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        issueId: string,
        dto: ActualizarIncidenciaDto,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        // Obtener datos anteriores antes de actualizar (para auditoría)
        let datosAnteriores: any = null;
        try {
            const issueAnterior = await this.autodeskApiService.obtenerIncidenciaPorId(accessToken, projectId, issueId);
            if (issueAnterior) {
                datosAnteriores = {
                    title: issueAnterior.title,
                    status: issueAnterior.status,
                    description: issueAnterior.description?.substring(0, 200),
                };
            }
        } catch (error) {
            // Si falla obtener datos anteriores, continuar sin ellos
        }

        const updateData: Record<string, any> = {};
        if (dto.title !== undefined) updateData.title = dto.title.substring(0, 100);
        if (dto.description !== undefined) updateData.description = dto.description.substring(0, 1000);
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.issueSubtypeId !== undefined) updateData.issueSubtypeId = dto.issueSubtypeId;
        if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate;
        if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
        if (dto.assignedToType !== undefined) updateData.assignedToType = dto.assignedToType;
        if (dto.rootCauseId !== undefined) updateData.rootCauseId = dto.rootCauseId;
        if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
        if (dto.locationId !== undefined) updateData.locationId = dto.locationId;
        if (dto.locationDetails !== undefined) updateData.locationDetails = dto.locationDetails.substring(0, 250);

        const resultado = await this.autodeskApiService.actualizarIncidencia(accessToken, projectId, issueId, updateData);

        // Registrar auditoría si la actualización fue exitosa
        if (resultado && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'ISSUE_UPDATE',
                    'issue',
                    null, // No usar el ID de ACC como identidad porque es string
                    `Incidencia actualizada: ${issueId}`,
                    datosAnteriores,
                    {
                        issueId,
                        projectId,
                        title: updateData.title || datosAnteriores?.title,
                        status: updateData.status || datosAnteriores?.status,
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accIssueId: issueId, // ID de la incidencia de ACC (string/UUID)
                        rol: userRole || null, // Rol del usuario al momento de actualizar la incidencia
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
            }
        }

        return resultado;
    }
}


