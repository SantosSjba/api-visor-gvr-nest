import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearAdjuntoDto } from '../../../dtos/acc/issues/crear-adjunto.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class CrearAdjuntoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        dto: CrearAdjuntoDto,
        file?: Express.Multer.File,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        let storageUrn = dto.urn;
        let fileName = dto.fileName || dto.name || 'Attachment';

        // Si hay archivo, subirlo primero
        if (file) {
            fileName = file.originalname;
            const contentType = file.mimetype;

            // Usar el helper existente (aunque diga miniatura, sirve para archivos en general)
            const uploadResult = await this.autodeskApiService.subirMiniaturaIssue(
                accessToken,
                projectId,
                file.buffer, // En memoria
                fileName,
                contentType
            );

            if (!uploadResult.success || !uploadResult.urn) {
                throw new BadRequestException(`Error al subir el archivo: ${uploadResult.error || 'Error desconocido'}`);
            }

            storageUrn = uploadResult.urn;
        }

        if (!storageUrn) {
            throw new BadRequestException('El URN es requerido. Por favor, suba el archivo o proporcione un URN.');
        }

        const attachmentData = {
            urn: storageUrn,
            name: dto.name || dto.displayName || fileName,
            fileName: fileName,
            type: dto.type || 'image', // 'image' is default but can be 'document' etc.
        };

        const resultado = await this.autodeskApiService.crearAdjunto(accessToken, projectId, dto.issueId, attachmentData);

        // El servicio retorna un objeto con una propiedad 'attachments' que es un array
        // Verificar si el adjunto se creó exitosamente
        const attachmentId = resultado?.attachmentId || 
                            resultado?.data?.attachmentId ||
                            (resultado?.attachments && Array.isArray(resultado.attachments) && resultado.attachments[0]?.attachmentId) ||
                            (Array.isArray(resultado) && resultado[0]?.attachmentId) ||
                            (Array.isArray(resultado?.data) && resultado.data[0]?.attachmentId);
        
        if (resultado && attachmentId && ipAddress && userAgent) {
            try {
                // El ID del adjunto de ACC es un string (UUID), no se puede usar como identidad (BIGINT)
                // Por lo tanto, usamos null para identidad y guardamos el ID real en metadatos
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'ATTACHMENT_CREATE',
                    'issue_attachment',
                    null, // No usar el ID de ACC como identidad porque es string
                    `Adjunto creado en incidencia ${dto.issueId}`,
                    null,
                    {
                        attachmentId,
                        issueId: dto.issueId,
                        projectId,
                        fileName,
                        fileType: dto.type || 'image',
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        issueId: dto.issueId,
                        accAttachmentId: attachmentId, // ID del adjunto de ACC (string/UUID)
                        rol: userRole || null, // Rol del usuario al momento de crear el adjunto
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla, solo loguear silenciosamente
                // El error se puede monitorear desde los logs de la base de datos
            }
        }

        return resultado;
    }
}


