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
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.sort) filters.sort = dto.sort;

        const resultado = await this.autodeskApiService.obtenerIncidencias(accessToken, projectId, filters);

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


