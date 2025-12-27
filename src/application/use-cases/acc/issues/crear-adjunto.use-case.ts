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

        if (!dto.urn && !file) {
            throw new BadRequestException('Se requiere un archivo (file) o un URN (urn)');
        }

        // Si hay archivo, necesitamos subirlo primero usando Data Management API
        // Por ahora, asumimos que el URN ya viene en el DTO o se subió previamente
        if (!dto.urn) {
            throw new BadRequestException('El URN es requerido. Por favor, suba el archivo primero.');
        }

        const attachmentData = {
            urn: dto.urn,
            name: dto.name || dto.displayName || 'Attachment',
            fileName: dto.fileName || dto.name || 'Attachment',
            type: dto.type || 'image',
        };

        return await this.autodeskApiService.crearAdjunto(accessToken, projectId, dto.issueId, attachmentData);
    }
}


