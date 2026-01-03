import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ObtenerIncidenciasPorDocumentoDto } from '../../dtos/issues-bim360/obtener-incidencias-por-documento.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../domain/repositories/acc-recursos.repository.interface';
import ObtenerTokenValidoHelper from '../acc/issues/obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciasPorDocumentoBim360UseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerIncidenciasPorDocumentoDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        // Decodificar URN si viene en base64
        let decodedUrn = dto.documentUrn;
        if (!decodedUrn.startsWith('urn:')) {
            try {
                const base64Standard = decodedUrn.replace(/-/g, '+').replace(/_/g, '/');
                const decoded = Buffer.from(base64Standard, 'base64').toString('utf-8');
                if (decoded.startsWith('urn:')) {
                    decodedUrn = decoded;
                }
            } catch (e) {
                // Si no es base64 válido, usar el original
            }
        }

        // Extraer lineage ID
        const documentLineageId = this.extraerLineageId(decodedUrn);

        // Intentar filtrar por linkedDocumentUrn
        const filters: Record<string, any> = {
            filter: {
                linkedDocumentUrn: decodedUrn,
            },
        };
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();

        try {
            const result = await this.autodeskApiService.obtenerIncidenciasBim360(accessToken, projectId, filters);
            if (result.data && result.data.length > 0) {
                // Enriquecer incidencias con información del usuario real desde auditoría
                const incidenciasEnriquecidas = await Promise.all(
                    result.data.map(async (issue: any) => {
                        try {
                            // Buscar en auditoría el registro de creación de esta incidencia
                            const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                                'issue',
                                'ISSUE_CREATE',
                                'accIssueId',
                                issue.id,
                            );

                            // Buscar asignación de la incidencia
                            const recursoAsignacion = await this.accRecursosRepository.obtenerRecurso('issue', issue.id);

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

                            // Agregar información del usuario asignado
                            if (recursoAsignacion && recursoAsignacion.idusuario_asignado) {
                                issueEnriquecida = {
                                    ...issueEnriquecida,
                                    assignedToReal: recursoAsignacion.usuario_asignado,
                                    assignedToRealId: recursoAsignacion.idusuario_asignado,
                                    assignedToRealRole: recursoAsignacion.rol_asignado || null,
                                };
                            }

                            return issueEnriquecida;
                        } catch (error) {
                            // Si falla la búsqueda de auditoría, retornar incidencia original
                            return issue;
                        }
                    }),
                );

                return {
                    ...result,
                    data: incidenciasEnriquecidas,
                };
            }
        } catch (error) {
            // Si el filtro no es soportado, continuar con obtener todas las incidencias
        }

        // Obtener todas las incidencias y filtrar manualmente
        const allIssues = await this.autodeskApiService.obtenerIncidenciasBim360(accessToken, projectId, {});
        const issues = allIssues.data || [];

        if (issues.length === 0) {
            return {
                data: [],
                pagination: allIssues.pagination || {},
            };
        }

        // Filtrar incidencias por documento
        const filteredIssues = this.filtrarIncidenciasPorUrn(issues, dto.documentUrn, decodedUrn, documentLineageId);

        // Enriquecer incidencias con información del usuario real desde auditoría
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

    private extraerLineageId(urn: string): string | null {
        const match1 = urn.match(/fs\.file:vf\.([^?&]+)/);
        if (match1) return match1[1];

        const match2 = urn.match(/dm\.lineage:([^?&]+)/);
        if (match2) return match2[1];

        const match3 = urn.match(/wip\.dm\.folder:([^?&]+)/);
        if (match3) return match3[1];

        const match4 = urn.match(/urn:[^:]+:[^:]+:([^?&]+)/);
        if (match4) return match4[1];

        return null;
    }

    private filtrarIncidenciasPorUrn(issues: any[], originalUrn: string, decodedUrn: string, documentLineageId: string | null): any[] {
        return issues.filter((issue) => {
            const linkedDocs = issue.linked_documents || issue.linkedDocuments || [];

            if (linkedDocs.length === 0) {
                return false;
            }

            for (const doc of linkedDocs) {
                const issueUrn = doc.urn || '';

                if (!issueUrn) {
                    continue;
                }

                // Comparar lineage IDs
                if (documentLineageId) {
                    const issueLineageId = this.extraerLineageId(issueUrn);
                    if (issueLineageId && documentLineageId === issueLineageId) {
                        return true;
                    }
                }

                // Comparar URNs normalizados
                const normalizedIssueUrn = this.normalizarUrn(issueUrn);
                const normalizedDocUrn1 = this.normalizarUrn(decodedUrn);
                const normalizedDocUrn2 = this.normalizarUrn(originalUrn);

                if (normalizedIssueUrn === normalizedDocUrn1 || normalizedIssueUrn === normalizedDocUrn2) {
                    return true;
                }

                // Comparación parcial
                if (issueUrn.includes(decodedUrn) || decodedUrn.includes(issueUrn)) {
                    return true;
                }
            }

            return false;
        });
    }

    private normalizarUrn(urn: string): string {
        let normalized = urn.replace(/^urn:/i, '');
        normalized = normalized.split('?')[0];
        normalized = normalized.toLowerCase().trim();
        return normalized;
    }
}

