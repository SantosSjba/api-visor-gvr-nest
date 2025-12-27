import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';

@Injectable()
export class SubirImagenProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(
        accountId: string,
        projectId: string,
        file: Express.Multer.File,
        token?: string,
    ): Promise<any> {
        if (!file) {
            throw new BadRequestException('El archivo de imagen es requerido');
        }

        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipo de archivo no soportado. Use: PNG, JPEG, JPG, BMP o GIF');
        }

        return await this.autodeskApiService.uploadAccProjectImage(
            accountId,
            projectId,
            file,
            token,
        );
    }
}
