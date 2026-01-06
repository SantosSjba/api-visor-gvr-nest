import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GetProyectosDto } from '../../../dtos/acc/projects/get-proyectos.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class GetProyectosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(accountId: string, dto: GetProyectosDto): Promise<any> {
        const options: Record<string, any> = {};

        if (dto.fields) {
            options.fields = dto.fields.split(',').map(f => f.trim());
        }

        if (dto.filter_classification) {
            options['filter[classification]'] = dto.filter_classification;
        }

        if (dto.filter_platform) {
            options['filter[platform]'] = dto.filter_platform;
        }

        if (dto.filter_products) {
            options['filter[products]'] = dto.filter_products;
        }

        if (dto.filter_name) {
            options['filter[name]'] = dto.filter_name;
        }

        if (dto.filter_type) {
            options['filter[type]'] = dto.filter_type;
        }

        if (dto.filter_status) {
            options['filter[status]'] = dto.filter_status;
        }

        if (dto.filter_businessUnitId) {
            options['filter[businessUnitId]'] = dto.filter_businessUnitId;
        }

        if (dto.filter_jobNumber) {
            options['filter[jobNumber]'] = dto.filter_jobNumber;
        }

        if (dto.filter_updatedAt) {
            options['filter[updatedAt]'] = dto.filter_updatedAt;
        }

        if (dto.filterTextMatch) {
            options.filterTextMatch = dto.filterTextMatch;
        }

        if (dto.sort) {
            options.sort = dto.sort;
        }

        options.limit = dto.limit || 20;
        options.offset = dto.offset || 0;

        const resultado = await this.autodeskApiService.getAccProjects(
            accountId,
            options,
            dto.token,
        );

        // Enriquecer proyectos con información de auditoría
        const proyectos = resultado?.results || resultado?.data?.results || [];
        
        if (Array.isArray(proyectos) && proyectos.length > 0) {
            const proyectosEnriquecidos = await Promise.all(
                proyectos.map(async (proyecto: any) => {
                    try {
                        const proyectoId = proyecto.id;

                        // Buscar en auditoría el registro de creación de este proyecto
                        const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                            'project',
                            'PROJECT_CREATE',
                            'accProjectId',
                            proyectoId,
                        );

                        if (registroCreacion && registroCreacion.usuario) {
                            return {
                                ...proyecto,
                                createdByReal: registroCreacion.usuario,
                                createdByRealId: registroCreacion.idusuario,
                                createdByRealRole: registroCreacion.rol || null,
                            };
                        }

                        return proyecto;
                    } catch (error) {
                        // Si falla la búsqueda, retornar proyecto original
                        return proyecto;
                    }
                }),
            );

            // Retornar con la estructura original
            if (resultado?.results) {
                return {
                    ...resultado,
                    results: proyectosEnriquecidos,
                };
            } else if (resultado?.data) {
                return {
                    ...resultado,
                    data: {
                        ...resultado.data,
                        results: proyectosEnriquecidos,
                    },
                };
            } else {
                return {
                    ...resultado,
                    results: proyectosEnriquecidos,
                };
            }
        }

        return resultado;
    }
}
