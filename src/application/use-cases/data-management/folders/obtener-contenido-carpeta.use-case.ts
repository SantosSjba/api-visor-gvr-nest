import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ACC_RESOURCES_REPOSITORY, type IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ObtenerContenidoCarpetaDto } from '../../../dtos/data-management/folders/obtener-contenido-carpeta.dto';

@Injectable()
export class ObtenerContenidoCarpetaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(userId: number, projectId: string, folderId: string, dto: ObtenerContenidoCarpetaDto, userRole?: string): Promise<any> {
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        // Pasar el DTO completo como filtros para que incluya filter[type], filter[extension.type], etc.
        const resultado = await this.autodeskApiService.obtenerContenidoCarpeta(token.tokenAcceso, projectId, folderId, dto);

        // Verificar si el usuario es administrador
        const esAdministrador = userRole && (
            userRole.toLowerCase().includes('admin') ||
            userRole.toLowerCase().includes('administrador') ||
            userRole.toLowerCase() === 'admin' ||
            userRole.toLowerCase() === 'administrador'
        );

        // Enriquecer contenido con información de auditoría y filtrar por permisos
        const items = resultado?.data || [];
        
        if (Array.isArray(items) && items.length > 0) {
            // Si NO es administrador, obtener permisos de carpetas del usuario
            let carpetasConAcceso: Set<string> = new Set();
            if (!esAdministrador) {
                try {
                    // Obtener todos los permisos del usuario para carpetas
                    let offset = 0;
                    const limit = 1000;
                    let hasMore = true;
                    
                    while (hasMore) {
                        const permisosUsuario = await this.accResourcesRepository.listarPermisosUsuario({
                            userId,
                            limit,
                            offset,
                        });
                        
                        // Filtrar solo recursos de tipo 'folder' y obtener sus externalIds
                        const carpetasAcceso = (permisosUsuario.data || [])
                            .filter((p: any) => p.resourcetype === 'folder' && p.externalid)
                            .map((p: any) => p.externalid);
                        
                        carpetasAcceso.forEach((id: string) => carpetasConAcceso.add(id));
                        
                        // Verificar si hay más resultados
                        const total = permisosUsuario.pagination?.total || 0;
                        hasMore = (offset + limit) < total;
                        offset += limit;
                    }
                } catch (error) {
                    console.warn('Error obteniendo permisos de carpetas del usuario:', error);
                }
            }

            const itemsEnriquecidos = await Promise.all(
                items.map(async (item: any) => {
                    try {
                        const itemId = item.id;
                        const itemType = item.type;

                        // Si es una carpeta y NO es administrador, filtrar por permisos
                        if (itemType === 'folders' && !esAdministrador) {
                            // Si no hay carpetas con acceso, no mostrar ninguna
                            if (carpetasConAcceso.size === 0) {
                                return null;
                            }
                            
                            // Verificar si la carpeta tiene acceso
                            if (!carpetasConAcceso.has(itemId)) {
                                return null; // Filtrar esta carpeta
                            }
                        }

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

            // Filtrar los null (carpetas sin acceso)
            const itemsFiltrados = itemsEnriquecidos.filter((item: any) => item !== null);

            return {
                ...resultado,
                data: itemsFiltrados,
            };
        }

        return resultado;
    }
}
