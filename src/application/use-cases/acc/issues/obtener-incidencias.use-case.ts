import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerIncidenciasDto } from '../../../dtos/acc/issues/obtener-incidencias.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../../domain/repositories/acc-recursos.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciasUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerIncidenciasDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        const filters: Record<string, any> = {};
        if (dto.filter_status) filters['filter[status]'] = dto.filter_status;
        if (dto.filter_assignedTo) filters['filter[assignedTo]'] = dto.filter_assignedTo;
        if (dto.filter_issueTypeId) filters['filter[issueTypeId]'] = dto.filter_issueTypeId;
        if (dto.filter_rootCauseId) filters['filter[rootCauseId]'] = dto.filter_rootCauseId;
        if (dto.filter_locationId) filters['filter[locationId]'] = dto.filter_locationId;
        // Filtro por documento vinculado
        // Nota: Autodesk puede requerir el formato sin corchetes o con formato específico
        // Si falla, se puede intentar filtrar manualmente en el código
        if (dto.filter_linkedDocumentUrn) {
            // Intentar primero con el formato estándar (sin corchetes)
            filters['filter[linkedDocumentUrn]'] = dto.filter_linkedDocumentUrn;
        }
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.sort) filters.sort = dto.sort;

        let resultado: any;
        
        try {
            resultado = await this.autodeskApiService.obtenerIncidencias(accessToken, projectId, filters);
        } catch (error: any) {
            // Si el filtro de linkedDocumentUrn causa un error, intentar sin ese filtro y filtrar manualmente
            const filterUrn = dto.filter_linkedDocumentUrn;
            if (filterUrn && error.message?.includes('500')) {
                const filtersWithoutLinkedDoc = { ...filters };
                delete filtersWithoutLinkedDoc['filter[linkedDocumentUrn]'];
                
                resultado = await this.autodeskApiService.obtenerIncidencias(accessToken, projectId, filtersWithoutLinkedDoc);
                
                // Filtrar manualmente por documento vinculado
                const incidencias = resultado?.data?.results || resultado?.results || [];
                const filteredIssues = incidencias.filter((issue: any) => {
                    if (!issue.linkedDocuments || issue.linkedDocuments.length === 0) {
                        return false;
                    }
                    return issue.linkedDocuments.some((doc: any) => {
                        const docUrn = doc.urn || '';
                        // Comparar URNs (puede ser exacto o parcial)
                        return docUrn === filterUrn || 
                               docUrn.includes(filterUrn) || 
                               filterUrn.includes(docUrn);
                    });
                });
                
                // Reemplazar los resultados con los filtrados
                if (resultado?.data) {
                    resultado.data.results = filteredIssues;
                    if (resultado.data.pagination) {
                        resultado.data.pagination.totalResults = filteredIssues.length;
                    }
                } else {
                    resultado.results = filteredIssues;
                }
            } else {
                throw error;
            }
        }

        // Enriquecer incidencias con información del usuario real desde auditoría
        // La estructura puede ser: { data: { results: [...] } } o { results: [...] }
        const incidencias = resultado?.data?.results || resultado?.results || [];
        
        if (Array.isArray(incidencias) && incidencias.length > 0) {
            const incidenciasEnriquecidas = await Promise.all(
                incidencias.map(async (issue: any) => {
                    try {
                        // Buscar en auditoría el registro de creación de esta incidencia
                        const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                            'issue',
                            'ISSUE_CREATE',
                            'accIssueId',
                            issue.id,
                        );

                        // Buscar asignaciones múltiples de la incidencia
                        const usuariosAsignados = await this.accRecursosRepository.obtenerUsuariosAsignadosIncidencia(issue.id);

                        let issueEnriquecida: any = { ...issue };

                        // Agregar información del creador real
                        if (registroCreacion && registroCreacion.usuario) {
                            issueEnriquecida = {
                                ...issueEnriquecida,
                                createdByReal: registroCreacion.usuario,
                                createdByRealId: registroCreacion.idusuario,
                                createdByRealRole: registroCreacion.rol || null,
                                createdByAcc: issue.createdBy,
                            };
                        }

                        // Agregar información de usuarios asignados (múltiples)
                        if (usuariosAsignados && usuariosAsignados.success && usuariosAsignados.data && usuariosAsignados.data.length > 0) {
                            const usuarios = usuariosAsignados.data;
                            // Mantener compatibilidad: usar el primer usuario asignado para campos legacy
                            const primerUsuario = usuarios[0];
                            issueEnriquecida = {
                                ...issueEnriquecida,
                                assignedToReal: primerUsuario.usuario,
                                assignedToRealId: primerUsuario.userId,
                                assignedToRealRole: primerUsuario.rol || null,
                                // Nuevos campos para múltiples asignaciones
                                assignedToRealMultiple: usuarios.map((u: any) => ({
                                    userId: u.userId,
                                    usuario: u.usuario,
                                    correo: u.correo,
                                    fotoPerfil: u.fotoPerfil || null,
                                    rol: u.rol,
                                    fechaAsignacion: u.fechaAsignacion,
                                })),
                                assignedToRealIds: usuarios.map((u: any) => u.userId),
                            };
                        }

                        return issueEnriquecida;
                    } catch (error) {
                        // Si falla la búsqueda, retornar incidencia original
                        return issue;
                    }
                }),
            );

            // Retornar con la estructura original
            if (resultado?.data) {
                return {
                    ...resultado,
                    data: {
                        ...resultado.data,
                        results: incidenciasEnriquecidas,
                    },
                };
            } else {
                return {
                    ...resultado,
                    results: incidenciasEnriquecidas,
                };
            }
        }

        return resultado;
    }
}


