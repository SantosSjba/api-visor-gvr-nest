import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearAdjuntoDto } from '../../../dtos/acc/issues/crear-adjunto.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class CrearAdjuntoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        dto: CrearAdjuntoDto,
        file?: Express.Multer.File,
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

        return await this.autodeskApiService.crearAdjunto(accessToken, projectId, dto.issueId, attachmentData);
    }
}


