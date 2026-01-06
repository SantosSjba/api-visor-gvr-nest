import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ActualizarCarpetaDto } from '../../../dtos/data-management/folders/actualizar-carpeta.dto';

@Injectable()
export class ActualizarCarpetaUseCase {
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
        folderId: string,
        dto: ActualizarCarpetaDto,
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

        // Obtener datos anteriores antes de actualizar (para auditoría)
        let datosAnteriores: any = null;
        try {
            const carpetaAnterior = await this.autodeskApiService.obtenerCarpetaPorId(token.tokenAcceso, projectId, folderId);
            if (carpetaAnterior?.data) {
                datosAnteriores = {
                    displayName: carpetaAnterior.data.attributes?.displayName || null,
                };
            }
        } catch (error) {
            // Si falla obtener datos anteriores, continuar sin ellos
        }

        const resultado = await this.autodeskApiService.actualizarCarpeta(token.tokenAcceso, projectId, folderId, dto.data);

        // Registrar auditoría si la actualización fue exitosa
        if (resultado?.data && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'FOLDER_UPDATE',
                    'folder',
                    null,
                    `Carpeta actualizada: ${resultado.data.attributes?.displayName || folderId}`,
                    datosAnteriores,
                    {
                        folderId,
                        projectId,
                        displayName: resultado.data.attributes?.displayName || null,
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accFolderId: folderId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de actualización de carpeta:', error);
            }
        }

        return resultado;
    }
}
