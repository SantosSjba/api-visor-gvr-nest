import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { CrearSubcarpetaDto } from '../../../dtos/data-management/folders/crear-subcarpeta.dto';

@Injectable()
export class CrearSubcarpetaUseCase {
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
        parentFolderId: string,
        dto: CrearSubcarpetaDto,
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

        const resultado = await this.autodeskApiService.crearSubcarpeta(
            token.tokenAcceso,
            projectId,
            parentFolderId,
            dto.folderName,
            dto.folderType
        );

        // Registrar auditoría si la subcarpeta se creó exitosamente
        const folderId = resultado?.data?.id;
        const folderName = dto.folderName || 'Nueva subcarpeta';

        if (folderId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'FOLDER_CREATE',
                    'folder',
                    null,
                    `Subcarpeta creada: ${folderName.substring(0, 100)}`,
                    null,
                    {
                        folderId,
                        projectId,
                        parentFolderId,
                        folderName: folderName.substring(0, 100),
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accFolderId: folderId,
                        accParentFolderId: parentFolderId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de creación de subcarpeta:', error);
            }
        }

        return resultado;
    }
}
