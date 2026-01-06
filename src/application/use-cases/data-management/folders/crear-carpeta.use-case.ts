import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { CrearCarpetaDto } from '../../../dtos/data-management/folders/crear-carpeta.dto';

@Injectable()
export class CrearCarpetaUseCase {
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
        dto: CrearCarpetaDto,
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

        const resultado = await this.autodeskApiService.crearCarpeta(token.tokenAcceso, projectId, dto.data);

        // Registrar auditoría si la carpeta se creó exitosamente
        const folderId = resultado?.data?.id;
        const folderName = resultado?.data?.attributes?.displayName || resultado?.data?.attributes?.name || dto.data?.attributes?.name || 'Nueva carpeta';

        if (folderId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'FOLDER_CREATE',
                    'folder',
                    null,
                    `Carpeta creada: ${folderName.substring(0, 100)}`,
                    null,
                    {
                        folderId,
                        projectId,
                        folderName: folderName.substring(0, 100),
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
                console.error('Error registrando auditoría de creación de carpeta:', error);
            }
        }

        return resultado;
    }
}
