import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { ACC_RESOURCES_REPOSITORY, type IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';

@Injectable()
export class SincronizarCarpetasProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    /**
     * Sincroniza todas las carpetas de un proyecto recursivamente
     * y asigna permisos por defecto a todos los usuarios con acceso al proyecto
     */
    async execute(userId: number, projectId: string, hubId: string): Promise<any> {
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        // 1. Obtener o crear el recurso del proyecto
        const proyectoRecurso = await this.accResourcesRepository.obtenerRecursoPorExternalId(projectId);
        let proyectoResourceId: number;

        if (proyectoRecurso) {
            proyectoResourceId = proyectoRecurso.id;
        } else {
            // Si no existe, crear el recurso del proyecto
            const proyectoData = await this.autodeskApiService.obtenerProyectoPorId(token.tokenAcceso, hubId, projectId);
            const nuevoRecurso = await this.accResourcesRepository.crearRecurso({
                external_id: projectId,
                resource_type: 'project',
                name: proyectoData?.data?.attributes?.name || 'Proyecto',
                parent_id: undefined,
                account_id: undefined,
                idUsuarioCreacion: userId,
            });
            proyectoResourceId = nuevoRecurso.id;
        }

        // 2. Obtener todos los usuarios con acceso al proyecto
        const usuariosProyecto = await this.accResourcesRepository.listarUsuariosRecurso(proyectoResourceId);
        let userIds = usuariosProyecto.data?.map((u: any) => u.userid) || [];

        // Si no hay usuarios con acceso al proyecto, asignar al menos al usuario que está ejecutando la sincronización
        if (userIds.length === 0) {
            try {
                await this.accResourcesRepository.asignarPermisoUsuario({
                    user_id: userId,
                    resource_id: proyectoResourceId,
                    idUsuarioCreacion: userId,
                });
                userIds = [userId];
            } catch (error) {
                console.warn('Error asignando permiso inicial al usuario:', error);
                // Si falla, intentar continuar con el usuario actual de todas formas
                userIds = [userId];
            }
        } else {
            // Asegurarse de que el usuario actual también esté en la lista
            if (!userIds.includes(userId)) {
                try {
                    await this.accResourcesRepository.asignarPermisoUsuario({
                        user_id: userId,
                        resource_id: proyectoResourceId,
                        idUsuarioCreacion: userId,
                    });
                    userIds.push(userId);
                } catch (error) {
                    console.warn('Error asignando permiso al usuario actual:', error);
                }
            }
        }

        // 3. Obtener carpetas principales del proyecto
        const carpetasPrincipales = await this.autodeskApiService.obtenerCarpetasPrincipales(token.tokenAcceso, hubId, projectId);
        const topFolders = carpetasPrincipales?.data || [];

        let carpetasSincronizadas = 0;

        // 4. Función recursiva para sincronizar carpetas
        const sincronizarCarpetaRecursiva = async (folderId: string, folderName: string, parentResourceId: number): Promise<void> => {
            try {
                // Obtener o crear el recurso de la carpeta
                let carpetaRecurso = await this.accResourcesRepository.obtenerRecursoPorExternalId(folderId);
                let carpetaResourceId: number;

                if (carpetaRecurso) {
                    carpetaResourceId = carpetaRecurso.id;
                } else {
                    // Crear el recurso de la carpeta
                    const nuevoRecurso = await this.accResourcesRepository.crearRecurso({
                        external_id: folderId,
                        resource_type: 'folder',
                        name: folderName,
                        parent_id: parentResourceId,
                        account_id: undefined,
                        idUsuarioCreacion: userId,
                    });
                    carpetaResourceId = nuevoRecurso.id;
                    carpetasSincronizadas++;
                }

                // Asignar permisos a todos los usuarios del proyecto
                for (const userIdItem of userIds) {
                    try {
                        // Verificar si el usuario ya tiene permiso
                        const usuariosCarpeta = await this.accResourcesRepository.listarUsuariosRecurso(carpetaResourceId);
                        const tienePermiso = usuariosCarpeta.data?.some((u: any) => u.userid === userIdItem);

                        if (!tienePermiso) {
                            await this.accResourcesRepository.asignarPermisoUsuario({
                                user_id: userIdItem,
                                resource_id: carpetaResourceId,
                                idUsuarioCreacion: userId,
                            });
                        }
                    } catch (error) {
                        console.warn(`Error asignando permiso al usuario ${userIdItem} para carpeta ${folderId}:`, error);
                    }
                }

                // Obtener subcarpetas de esta carpeta
                try {
                    const contenidoCarpeta = await this.autodeskApiService.obtenerContenidoCarpeta(
                        token.tokenAcceso,
                        projectId,
                        folderId,
                        { 'filter[type]': 'folders' }
                    );

                    const subcarpetas = contenidoCarpeta?.data || [];

                    // Sincronizar cada subcarpeta recursivamente
                    for (const subcarpeta of subcarpetas) {
                        const subcarpetaId = subcarpeta.id;
                        const subcarpetaName = subcarpeta.attributes?.displayName || subcarpeta.attributes?.name || 'Carpeta';
                        await sincronizarCarpetaRecursiva(subcarpetaId, subcarpetaName, carpetaResourceId);
                    }
                } catch (error) {
                    console.warn(`Error obteniendo subcarpetas de ${folderId}:`, error);
                }
            } catch (error) {
                console.error(`Error sincronizando carpeta ${folderId}:`, error);
            }
        };

        // 5. Sincronizar cada carpeta principal recursivamente
        for (const topFolder of topFolders) {
            const folderId = topFolder.id;
            const folderName = topFolder.attributes?.displayName || topFolder.attributes?.name || 'Carpeta';
            await sincronizarCarpetaRecursiva(folderId, folderName, proyectoResourceId);
        }

        return {
            success: true,
            message: `Sincronización completada. ${carpetasSincronizadas} carpetas nuevas sincronizadas.`,
            carpetasSincronizadas,
        };
    }
}

