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
        // IMPORTANTE: Solo sincronizamos con los usuarios que YA tienen acceso explícito al proyecto
        // El admin puede ver todo sin necesidad de permisos explícitos
        const usuariosProyecto = await this.accResourcesRepository.listarUsuariosRecurso(proyectoResourceId);
        const userIds = usuariosProyecto.data?.map((u: any) => u.userid) || [];

        // 3. Obtener carpetas principales del proyecto
        const carpetasPrincipales = await this.autodeskApiService.obtenerCarpetasPrincipales(token.tokenAcceso, hubId, projectId);
        const topFolders = carpetasPrincipales?.data || [];

        let carpetasSincronizadas = 0;

        // 4. Función recursiva para sincronizar carpetas (solo crea los recursos, no asigna permisos)
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
                    // Error obteniendo subcarpetas, continuar con las demás
                }
            } catch (error) {
                // Error sincronizando carpeta, continuar con las demás
            }
        };

        // 5. Sincronizar cada carpeta principal recursivamente
        for (const topFolder of topFolders) {
            const folderId = topFolder.id;
            const folderName = topFolder.attributes?.displayName || topFolder.attributes?.name || 'Carpeta';
            await sincronizarCarpetaRecursiva(folderId, folderName, proyectoResourceId);
        }

        // 6. Sincronizar permisos: Anular accesos previos y asignar según usuarios del proyecto
        let permisosInfo = {
            usuarios: userIds.length,
            carpetasConPermisos: 0,
            permisosEliminados: 0,
            permisosAsignados: 0,
        };

        try {
            const resultadoPermisos = await this.accResourcesRepository.sincronizarPermisosProyecto({
                project_resource_id: proyectoResourceId,
                idUsuarioModificacion: userId,
            });

            if (resultadoPermisos?.success) {
                permisosInfo = {
                    usuarios: resultadoPermisos.usuarios_proyecto || userIds.length,
                    carpetasConPermisos: resultadoPermisos.carpetas_sincronizadas || 0,
                    permisosEliminados: resultadoPermisos.permisos_eliminados || 0,
                    permisosAsignados: resultadoPermisos.permisos_asignados || 0,
                };
            }
        } catch (error) {
            // Continuar aunque falle la sincronización de permisos
        }

        // Construir mensaje informativo
        let mensaje = `Sincronización completada. ${carpetasSincronizadas} carpetas nuevas sincronizadas.`;
        
        if (permisosInfo.usuarios > 0) {
            mensaje += ` ${permisosInfo.permisosAsignados} permisos asignados a ${permisosInfo.usuarios} usuarios en ${permisosInfo.carpetasConPermisos} carpetas (${permisosInfo.permisosEliminados} permisos previos eliminados).`;
        } else {
            mensaje += ` No se sincronizaron permisos porque no hay usuarios con acceso al proyecto.`;
        }

        return {
            success: true,
            message: mensaje,
            carpetasSincronizadas,
            permisosInfo,
        };
    }
}

