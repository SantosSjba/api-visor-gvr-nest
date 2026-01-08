import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class ActualizarItemUseCase {
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
        itemData: any,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!itemId) {
            throw new BadRequestException('El ID del item es requerido');
        }

        if (!itemData || Object.keys(itemData).length === 0) {
            throw new BadRequestException('Los datos del item son requeridos');
        }

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
            const itemAnterior = await this.autodeskApiService.obtenerItemPorId(token.tokenAcceso, projectId, itemId);
            if (itemAnterior?.data) {
                datosAnteriores = {
                    displayName: itemAnterior.data.attributes?.displayName || null,
                    extension: itemAnterior.data.attributes?.extension || null,
                };
            }
        } catch (error) {
            // Si falla obtener datos anteriores, continuar sin ellos
        }

        const resultado = await this.autodeskApiService.actualizarItem(token.tokenAcceso, projectId, itemId, itemData);

        // Registrar auditoría si la actualización fue exitosa
        if (resultado?.data && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'FILE_UPDATE',
                    'file',
                    null,
                    `Archivo actualizado: ${resultado.data.attributes?.displayName || itemId}`,
                    datosAnteriores,
                    {
                        itemId,
                        projectId,
                        displayName: resultado.data.attributes?.displayName || null,
                        extension: resultado.data.attributes?.extension || null,
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
                console.error('Error registrando auditoría de actualización de archivo:', error);
            }
        }

        return resultado;
    }
}

