import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearProyectoDto } from '../../../dtos/acc/projects/crear-proyecto.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from '../issues/obtener-token-valido.helper';

@Injectable()
export class CrearProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        accountId: string,
        dto: CrearProyectoDto,
        userId?: string | number,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        let accessToken = dto.token;

        // Si tenemos un userId, intentamos obtener su token 3-legged
        if (!accessToken && userId) {
            try {
                const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
                if (!isNaN(numericUserId)) {
                    accessToken = await this.obtenerTokenValidoHelper.execute(numericUserId);
                }
            } catch (error) {
                // Si falla el token 3-legged, continuará con el fallback 2-legged en el service
                console.warn('No se pudo obtener token 3-legged para el usuario:', userId, error.message);
            }
        }

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
        if (dto.products) projectData.products = dto.products;

        // Solo pasamos el userId al servicio si creemos que es un ID de Autodesk válido
        // (por ejemplo, si no es numérico pequeño o si vino explícitamente en el request original)
        let autodeskUserId: string | undefined = undefined;
        if (typeof userId === 'string' && userId.length > 5) {
            autodeskUserId = userId;
        }

        const resultado = await this.autodeskApiService.createAccProject(
            accountId,
            projectData,
            accessToken,
            autodeskUserId,
        );

        // Registrar auditoría si el proyecto se creó exitosamente
        const projectId = resultado?.id;
        const projectName = dto.name || 'Nuevo proyecto';

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
                    'PROJECT_CREATE',
                    'project',
                    null,
                    `Proyecto creado: ${projectName.substring(0, 100)}`,
                    null,
                    {
                        projectId,
                        accountId,
                        projectName: projectName.substring(0, 100),
                        type: dto.type || null,
                        jobNumber: dto.jobNumber || null,
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
                console.error('Error registrando auditoría de creación de proyecto:', error);
            }
        }

        return resultado;
    }
}
