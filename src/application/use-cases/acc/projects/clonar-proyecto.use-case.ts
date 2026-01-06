import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ClonarProyectoDto } from '../../../dtos/acc/projects/clonar-proyecto.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class ClonarProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        accountId: string,
        dto: ClonarProyectoDto,
        userId?: string | number,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        const projectData: Record<string, any> = {
            name: dto.name,
            template: {
                projectId: dto.templateId,
            },
        };

        if (dto.type) projectData.type = dto.type;
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

        // Convertir userId a string si es necesario (el servicio espera string)
        const userIdString = userId ? (typeof userId === 'string' ? userId : userId.toString()) : undefined;

        const resultado = await this.autodeskApiService.createAccProject(
            accountId,
            projectData,
            dto.token,
            userIdString,
        );

        // Registrar auditoría si el proyecto se clonó exitosamente
        const projectId = resultado?.id;
        const projectName = dto.name || 'Proyecto clonado';

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

        if (projectId && numericUserId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    numericUserId,
                    'PROJECT_CLONE',
                    'project',
                    null,
                    `Proyecto clonado: ${projectName.substring(0, 100)}`,
                    null,
                    {
                        projectId,
                        accountId,
                        templateId: dto.templateId,
                        projectName: projectName.substring(0, 100),
                        type: dto.type || null,
                    },
                    ipAddress,
                    userAgent,
                    {
                        accountId,
                        accProjectId: projectId,
                        accTemplateId: dto.templateId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de clonación de proyecto:', error);
            }
        }

        return resultado;
    }
}
