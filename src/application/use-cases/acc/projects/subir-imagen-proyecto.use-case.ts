import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class SubirImagenProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        accountId: string,
        projectId: string,
        file: Express.Multer.File,
        token?: string,
        userId?: string | number,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        if (!file) {
            throw new BadRequestException('El archivo de imagen es requerido');
        }

        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Tipo de archivo no soportado. Use: PNG, JPEG, JPG, BMP o GIF');
        }

        const resultado = await this.autodeskApiService.uploadAccProjectImage(
            accountId,
            projectId,
            file,
            token,
        );

        // Registrar auditoría si la imagen se subió exitosamente
        // Obtener userId numérico para auditoría
        let numericUserId: number | null = null;
        if (userId) {
            if (typeof userId === 'number') {
                numericUserId = userId;
            } else if (typeof userId === 'string') {
                const parsed = parseInt(userId, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    numericUserId = parsed;
                }
            }
        }

        if (resultado && numericUserId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    numericUserId,
                    'PROJECT_IMAGE_UPLOAD',
                    'project',
                    null,
                    `Imagen de proyecto subida: ${projectId}`,
                    null,
                    {
                        projectId,
                        accountId,
                        fileName: file.originalname,
                        fileSize: file.size,
                        mimeType: file.mimetype || 'unknown',
                    },
                    ipAddress,
                    userAgent,
                    {
                        accountId,
                        accProjectId: projectId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de subida de imagen de proyecto:', error);
            }
        }

        return resultado;
    }
}
