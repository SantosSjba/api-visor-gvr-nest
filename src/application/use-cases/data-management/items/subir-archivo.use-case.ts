import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import type { Express } from 'express';

@Injectable()
export class SubirArchivoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        folderId: string,
        file: Express.Multer.File,
    ): Promise<any> {
        // Validaciones
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!folderId) {
            throw new BadRequestException('El ID de la carpeta (folderId) es requerido');
        }

        if (!file) {
            throw new BadRequestException('El archivo es requerido');
        }

        // Obtener token del usuario
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        const fileName = file.originalname;
        const fileBuffer = file.buffer;

        // PASO 1: Crear storage
        const storageResult = await this.autodeskApiService.crearStorageParaItem(
            token.tokenAcceso,
            projectId,
            folderId,
            fileName,
        );

        if (!storageResult.data?.id) {
            throw new BadRequestException('No se pudo obtener el storage ID');
        }

        const storageId = storageResult.data.id;

        // Extraer bucketKey y objectKey del storage ID
        // Formato: urn:adsk.objects:os.object:wip.dm.prod/archivo.xlsx
        const storageIdMatch = storageId.match(/urn:adsk\.objects:os\.object:([^\/]+)\/(.+)/);

        if (!storageIdMatch || storageIdMatch.length !== 3) {
            throw new BadRequestException(`Formato de storage ID inválido: ${storageId}`);
        }

        const bucketKey = storageIdMatch[1];
        const objectKey = storageIdMatch[2];

        // PASO 2: Obtener URL firmada de S3
        const signedResult = await this.autodeskApiService.obtenerUrlFirmadaS3(
            token.tokenAcceso,
            bucketKey,
            objectKey,
            1,
        );

        if (!signedResult.urls || !signedResult.urls[0]) {
            throw new BadRequestException('No se pudo obtener la URL firmada de S3');
        }

        const signedUrl = signedResult.urls[0];
        const uploadKey = signedResult.uploadKey;

        // PASO 3: Subir archivo a la URL firmada de S3
        await this.autodeskApiService.subirArchivoAUrlFirmada(signedUrl, fileBuffer);

        // PASO 4: Completar la subida
        const uploadCompleteResult = await this.autodeskApiService.completarSubida(
            token.tokenAcceso,
            bucketKey,
            objectKey,
            uploadKey,
        );

        // PASO 5: Crear item (primera versión)
        const itemData = {
            jsonapi: {
                version: '1.0',
            },
            data: {
                type: 'items',
                attributes: {
                    displayName: fileName,
                    extension: {
                        type: 'items:autodesk.bim360:File',
                        version: '1.0',
                    },
                },
                relationships: {
                    tip: {
                        data: {
                            type: 'versions',
                            id: '1',
                        },
                    },
                    parent: {
                        data: {
                            type: 'folders',
                            id: folderId,
                        },
                    },
                },
            },
            included: [
                {
                    type: 'versions',
                    id: '1',
                    attributes: {
                        name: fileName,
                        extension: {
                            type: 'versions:autodesk.bim360:File',
                            version: '1.0',
                        },
                    },
                    relationships: {
                        storage: {
                            data: {
                                type: 'objects',
                                id: storageId,
                            },
                        },
                    },
                },
            ],
        };

        const itemResult = await this.autodeskApiService.crearItem(
            token.tokenAcceso,
            projectId,
            itemData,
        );

        return {
            success: true,
            storage: storageResult,
            upload: uploadCompleteResult,
            item: itemResult.data,
            included: itemResult.included || [],
        };
    }
}

