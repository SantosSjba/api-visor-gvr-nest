import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ObtenerContenidoCarpetaDto } from '../../../dtos/data-management/folders/obtener-contenido-carpeta.dto';

@Injectable()
export class ObtenerContenidoCarpetaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(userId: number, projectId: string, folderId: string, dto: ObtenerContenidoCarpetaDto): Promise<any> {
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        // Pasar el DTO completo como filtros para que incluya filter[type], filter[extension.type], etc.
        const resultado = await this.autodeskApiService.obtenerContenidoCarpeta(token.tokenAcceso, projectId, folderId, dto);

        // Enriquecer contenido con información de auditoría
        const items = resultado?.data || [];
        
        if (Array.isArray(items) && items.length > 0) {
            const itemsEnriquecidos = await Promise.all(
                items.map(async (item: any) => {
                    try {
                        const itemId = item.id;
                        const itemType = item.type;

                        // Buscar en auditoría según el tipo de item
                        if (itemType === 'items') {
                            // Para archivos, buscar creación
                            const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                                'file',
                                'FILE_UPLOAD',
                                'accItemId',
                                itemId,
                            );

                            if (registroCreacion && registroCreacion.usuario) {
                                return {
                                    ...item,
                                    createdByReal: registroCreacion.usuario,
                                    createdByRealId: registroCreacion.idusuario,
                                    createdByRealRole: registroCreacion.rol || null,
                                };
                            }
                        } else if (itemType === 'folders') {
                            // Para carpetas, buscar creación
                            const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                                'folder',
                                'FOLDER_CREATE',
                                'accFolderId',
                                itemId,
                            );

                            if (registroCreacion && registroCreacion.usuario) {
                                return {
                                    ...item,
                                    createdByReal: registroCreacion.usuario,
                                    createdByRealId: registroCreacion.idusuario,
                                    createdByRealRole: registroCreacion.rol || null,
                                };
                            }
                        }

                        return item;
                    } catch (error) {
                        // Si falla la búsqueda, retornar item original
                        return item;
                    }
                }),
            );

            return {
                ...resultado,
                data: itemsEnriquecidos,
            };
        }

        return resultado;
    }
}
