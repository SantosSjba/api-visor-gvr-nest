import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerIncidenciasPorDocumentoDto } from '../../../dtos/acc/issues/obtener-incidencias-por-documento.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciasPorDocumentoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerIncidenciasPorDocumentoDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        // Intentar filtrar por linkedDocumentUrn
        const filters: Record<string, any> = {
            'filter[linkedDocumentUrn]': dto.documentUrn,
        };
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();

        try {
            const result = await this.autodeskApiService.obtenerIncidencias(accessToken, projectId, filters);
            if (result.results && result.results.length > 0) {
                // Enriquecer incidencias con información del usuario real desde auditoría
                const incidenciasEnriquecidas = await Promise.all(
                    result.results.map(async (issue: any) => {
                        try {
                            // Buscar en auditoría el registro de creación de esta incidencia
                            const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                                'issue',
                                'ISSUE_CREATE',
                                'accIssueId',
                                issue.id,
                            );

                            if (registroCreacion && registroCreacion.usuario) {
                                return {
                                    ...issue,
                                    createdByReal: registroCreacion.usuario,
                                    createdByRealId: registroCreacion.idusuario,
                                    createdByRealRole: registroCreacion.rol || null,
                                    // Mantener createdBy original de ACC para referencia
                                    createdByAcc: issue.createdBy,
                                };
                            }

                            return issue;
                        } catch (error) {
                            // Si falla la búsqueda de auditoría, retornar incidencia original
                            return issue;
                        }
                    }),
                );

                return {
                    data: incidenciasEnriquecidas,
                    pagination: result.pagination || {},
                };
            }
        } catch (error) {
            // Si el filtro no es soportado, continuar con obtener todas las incidencias
        }

        // Obtener todas las incidencias y filtrar manualmente
        const allIssues = await this.autodeskApiService.obtenerIncidencias(accessToken, projectId, {});
        const issues = allIssues.results || [];

        // Filtrar por documento (lógica simplificada)
        const filteredIssues = issues.filter((issue: any) => {
            if (!issue.linkedDocuments || issue.linkedDocuments.length === 0) {
                return false;
            }
            return issue.linkedDocuments.some((doc: any) => {
                const docUrn = doc.urn || '';
                return docUrn.includes(dto.documentUrn) || dto.documentUrn.includes(docUrn);
            });
        });

        // Enriquecer incidencias filtradas con información del usuario real desde auditoría
        if (Array.isArray(filteredIssues) && filteredIssues.length > 0) {
            const incidenciasEnriquecidas = await Promise.all(
                filteredIssues.map(async (issue: any) => {
                    try {
                        // Buscar en auditoría el registro de creación de esta incidencia
                        const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                            'issue',
                            'ISSUE_CREATE',
                            'accIssueId',
                            issue.id,
                        );

                        if (registroCreacion && registroCreacion.usuario) {
                            return {
                                ...issue,
                                createdByReal: registroCreacion.usuario,
                                createdByRealId: registroCreacion.idusuario,
                                createdByRealRole: registroCreacion.rol || null,
                                // Mantener createdBy original de ACC para referencia
                                createdByAcc: issue.createdBy,
                            };
                        }

                        return issue;
                    } catch (error) {
                        // Si falla la búsqueda de auditoría, retornar incidencia original
                        return issue;
                    }
                }),
            );

            return {
                data: incidenciasEnriquecidas,
                pagination: allIssues.pagination || {},
            };
        }

        return {
            data: filteredIssues,
            pagination: allIssues.pagination || {},
        };
    }
}


