import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerIncidenciasPorDocumentoDto } from '../../../dtos/acc/issues/obtener-incidencias-por-documento.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciasPorDocumentoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
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
                return {
                    data: result.results,
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

        return {
            data: filteredIssues,
            pagination: allIssues.pagination || {},
        };
    }
}


