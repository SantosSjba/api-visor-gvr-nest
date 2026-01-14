import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ClonarProyectoDto } from '../../../dtos/acc/projects/clonar-proyecto.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ACC_RESOURCES_REPOSITORY, type IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';

@Injectable()
export class ClonarProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
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
                // Registrar auditoría
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

                // Crear o obtener el recurso del proyecto clonado
                try {
                    const recursoResult = await this.accResourcesRepository.crearRecurso({
                        external_id: projectId,
                        resource_type: 'project',
                        name: projectName.substring(0, 255),
                        parent_id: undefined,
                        account_id: accountId,
                        idUsuarioCreacion: numericUserId,
                    });

                    // Si el recurso se creó/obtuvo exitosamente, asignar permiso de ADMINISTRADOR al usuario creador
                    if (recursoResult && recursoResult.success && recursoResult.id) {
                        try {
                            // Obtener el nivel de permiso de administrador dinámicamente
                            const nivelesPermiso = await this.accResourcesRepository.listarNivelesPermiso();
                            const nivelAdmin = nivelesPermiso.data?.find(
                                (nivel: any) => nivel.code === 'admin' || nivel.code?.toLowerCase() === 'admin'
                            );
                            const adminLevelId = nivelAdmin?.id || 6; // Fallback a 6 si no se encuentra

                            await this.accResourcesRepository.asignarPermisoUsuario({
                                user_id: numericUserId,
                                resource_id: recursoResult.id,
                                permission_level_id: adminLevelId,
                                idUsuarioCreacion: numericUserId,
                            });
                        } catch (permisoError) {
                            // No fallar si el permiso ya existe o hay algún error
                            console.warn('Error asignando permiso automático al creador del proyecto clonado:', permisoError.message);
                        }
                    }
                } catch (recursoError) {
                    // No fallar la operación si la creación del recurso falla
                    console.warn('Error creando recurso del proyecto clonado:', recursoError);
                }
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de clonación de proyecto:', error);
            }
        }

        return resultado;
    }
}
