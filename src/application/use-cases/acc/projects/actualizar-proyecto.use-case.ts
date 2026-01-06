import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarProyectoDto } from '../../../dtos/acc/projects/actualizar-proyecto.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class ActualizarProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        accountId: string,
        projectId: string,
        dto: ActualizarProyectoDto,
        userId?: string | number,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
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

        // Obtener datos anteriores antes de actualizar (para auditoría)
        let datosAnteriores: any = null;
        try {
            const proyectoAnterior = await this.autodeskApiService.getAccProjectById(
                projectId,
                ['name', 'type', 'jobNumber', 'status'],
                dto.token,
            );
            if (proyectoAnterior) {
                datosAnteriores = {
                    name: proyectoAnterior.name || null,
                    type: proyectoAnterior.type || null,
                    jobNumber: proyectoAnterior.jobNumber || null,
                    status: proyectoAnterior.status || null,
                };
            }
        } catch (error) {
            // Si falla obtener datos anteriores, continuar sin ellos
        }

        // Convertir userId a string si es necesario (el servicio espera string)
        const userIdString = userId ? (typeof userId === 'string' ? userId : userId.toString()) : undefined;

        const resultado = await this.autodeskApiService.updateAccProject(
            accountId,
            projectId,
            projectData,
            dto.token,
            userIdString,
        );

        // Registrar auditoría si la actualización fue exitosa
        // Obtener userId numérico para auditoría
        let numericUserId: number | null = null;
        if (userId) {
            if (typeof userId === 'number') {
                numericUserId = userId;
            } else if (typeof userId === 'string') {
                const parsed = parseInt(userId, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    numericUserId = parsed;
                }
            }
        }

        if (resultado && numericUserId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    numericUserId,
                    'PROJECT_UPDATE',
                    'project',
                    null,
                    `Proyecto actualizado: ${resultado.name || projectId}`,
                    datosAnteriores,
                    {
                        projectId,
                        accountId,
                        name: resultado.name || null,
                        type: resultado.type || null,
                        jobNumber: resultado.jobNumber || null,
                    },
                    ipAddress,
                    userAgent,
                    {
                        accountId,
                        accProjectId: projectId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de actualización de proyecto:', error);
            }
        }

        return resultado;
    }
}
