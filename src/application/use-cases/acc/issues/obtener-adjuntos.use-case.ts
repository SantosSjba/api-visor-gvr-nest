import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerAdjuntosDto } from '../../../dtos/acc/issues/obtener-adjuntos.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerAdjuntosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(userId: number, projectId: string, issueId: string, dto: ObtenerAdjuntosDto): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        
        const filters: Record<string, any> = {};
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();
        if (dto.sort) filters.sort = dto.sort;

        const resultado = await this.autodeskApiService.obtenerAdjuntos(accessToken, projectId, issueId, filters);

        // Enriquecer adjuntos con información del usuario real desde auditoría
        if (resultado && resultado.data && Array.isArray(resultado.data)) {
            const adjuntosEnriquecidos = await Promise.all(
                resultado.data.map(async (attachment: any) => {
                    try {
                        // Buscar en auditoría el registro de creación de este adjunto usando metadatos
                        // porque el ID de ACC es un string (UUID) y no se puede usar directamente como identidad
                        const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                            'issue_attachment',
                            'ATTACHMENT_CREATE',
                            'accAttachmentId',
                            attachment.attachmentId,
                        );

                        if (registroCreacion && registroCreacion.usuario) {
                            return {
                                ...attachment,
                                createdByReal: registroCreacion.usuario,
                                createdByRealId: registroCreacion.idusuario,
                                createdByRealRole: registroCreacion.rol || null,
                                // Mantener createdBy original de ACC para referencia
                                createdByAcc: attachment.createdBy,
                            };
                        }

                        return attachment;
                    } catch (error) {
                        // Si falla la búsqueda de auditoría, retornar adjunto original
                        return attachment;
                    }
                }),
            );

            return {
                ...resultado,
                data: adjuntosEnriquecidos,
            };
        }

        return resultado;
    }
}


