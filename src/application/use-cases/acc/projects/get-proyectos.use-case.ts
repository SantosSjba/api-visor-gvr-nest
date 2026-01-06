import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GetProyectosDto } from '../../../dtos/acc/projects/get-proyectos.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ACC_RESOURCES_REPOSITORY, type IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';

@Injectable()
export class GetProyectosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(accountId: string, dto: GetProyectosDto, userId?: number): Promise<any> {
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

        // Enriquecer proyectos con información de auditoría y filtrar por acceso de usuario
        const proyectos = resultado?.results || resultado?.data?.results || [];
        
        if (Array.isArray(proyectos) && proyectos.length > 0) {
            // Si hay userId, obtener los externalIds de los recursos (proyectos) a los que tiene acceso
            let proyectosConAcceso: Set<string> = new Set();
            if (userId) {
                try {
                    // Obtener todos los permisos del usuario (puede haber muchos, así que usamos un límite alto)
                    let offset = 0;
                    const limit = 1000;
                    let hasMore = true;
                    
                    while (hasMore) {
                        const permisosUsuario = await this.accResourcesRepository.listarPermisosUsuario({
                            userId,
                            limit,
                            offset,
                        });
                        
                        // Filtrar solo recursos de tipo 'project' y obtener sus externalIds
                        const proyectosAcceso = (permisosUsuario.data || [])
                            .filter((p: any) => p.resourcetype === 'project' && p.externalid)
                            .map((p: any) => p.externalid);
                        
                        proyectosAcceso.forEach((id: string) => proyectosConAcceso.add(id));
                        
                        // Verificar si hay más resultados
                        const total = permisosUsuario.pagination?.total || 0;
                        hasMore = (offset + limit) < total;
                        offset += limit;
                    }
                } catch (error) {
                    console.warn('Error obteniendo permisos del usuario:', error);
                }
            }

            const proyectosEnriquecidos = await Promise.all(
                proyectos.map(async (proyecto: any) => {
                    try {
                        const proyectoId = proyecto.id;

                        // Si hay userId, filtrar proyectos: solo mostrar los que el usuario tiene acceso
                        if (userId) {
                            // Si no hay proyectos con acceso, no mostrar ninguno
                            if (proyectosConAcceso.size === 0) {
                                return null;
                            }
                            
                            // Verificar si el proyectoId está en los proyectos con acceso
                            if (!proyectosConAcceso.has(proyectoId)) {
                                return null; // Filtrar este proyecto
                            }
                        }

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

            // Filtrar los null (proyectos sin acceso)
            const proyectosFiltrados = proyectosEnriquecidos.filter((p: any) => p !== null);

            // Retornar con la estructura original
            if (resultado?.results) {
                return {
                    ...resultado,
                    results: proyectosFiltrados,
                    pagination: resultado.pagination ? {
                        ...resultado.pagination,
                        totalResults: proyectosFiltrados.length,
                    } : undefined,
                };
            } else if (resultado?.data) {
                return {
                    ...resultado,
                    data: {
                        ...resultado.data,
                        results: proyectosFiltrados,
                        pagination: resultado.data.pagination ? {
                            ...resultado.data.pagination,
                            totalResults: proyectosFiltrados.length,
                        } : undefined,
                    },
                };
            } else {
                return {
                    ...resultado,
                    results: proyectosFiltrados,
                };
            }
        }

        return resultado;
    }
}
