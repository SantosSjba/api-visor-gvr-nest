import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { CopiarItemDto } from '../../../dtos/data-management/items/copiar-item.dto';

@Injectable()
export class CopiarItemUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) {}

    async execute(
        userId: number,
        projectId: string,
        dto: CopiarItemDto,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }
        if (!dto.sourceItemId || !dto.sourceVersionId || !dto.targetFolderId) {
            throw new BadRequestException('sourceItemId, sourceVersionId y targetFolderId son requeridos');
        }

        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);
        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Autoriza la aplicación primero.');
        }
        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Refresca tu token.');
        }

        const projectIdNorm = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

        try {
            const resultado = await this.autodeskApiService.copiarItem(
                token.tokenAcceso,
                projectIdNorm,
                dto.sourceVersionId,
                dto.targetFolderId,
            );

            const nuevoItem = resultado?.data;
            const displayName = nuevoItem?.attributes?.displayName || nuevoItem?.attributes?.name || 'archivo';

            if (ipAddress && userAgent) {
                try {
                    await this.auditoriaRepository.registrarAccion(
                        userId,
                        'FILE_COPY',
                        'file',
                        null,
                        `Archivo copiado: ${displayName}`,
                        {
                            sourceItemId: dto.sourceItemId,
                            sourceVersionId: dto.sourceVersionId,
                        },
                        {
                            targetFolderId: dto.targetFolderId,
                            newItemId: nuevoItem?.id || null,
                        },
                        ipAddress,
                        userAgent,
                        { projectId: projectIdNorm, accItemId: dto.sourceItemId, rol: userRole || null },
                    );
                } catch {
                    /* ignore audit errors */
                }
            }

            return resultado;
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException(
                `Error al copiar archivo: ${error?.message || 'No se pudo copiar el archivo'}`,
            );
        }
    }
}
