import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class DescargarItemUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        itemId: string,
        queryParams: any,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        const resultado = await this.autodeskApiService.descargarItem(token.tokenAcceso, projectId, itemId);

        // Registrar auditoría de descarga
        if (ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'FILE_DOWNLOAD',
                    'file',
                    null,
                    `Archivo descargado: ${itemId}`,
                    null,
                    {
                        itemId,
                        projectId,
                        fileName: resultado.fileName || 'unknown',
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accItemId: itemId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de descarga de archivo:', error);
            }
        }

        return resultado;
    }
}
