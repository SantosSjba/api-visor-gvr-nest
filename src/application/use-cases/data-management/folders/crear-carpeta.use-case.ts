import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ACC_RESOURCES_REPOSITORY, type IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { CrearCarpetaDto } from '../../../dtos/data-management/folders/crear-carpeta.dto';

@Injectable()
export class CrearCarpetaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        dto: CrearCarpetaDto,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        const resultado = await this.autodeskApiService.crearCarpeta(token.tokenAcceso, projectId, dto.data);

        // Registrar auditoría si la carpeta se creó exitosamente
        const folderId = resultado?.data?.id;
        const folderName = resultado?.data?.attributes?.displayName || resultado?.data?.attributes?.name || dto.data?.attributes?.name || 'Nueva carpeta';

        if (folderId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'FOLDER_CREATE',
                    'folder',
                    null,
                    `Carpeta creada: ${folderName.substring(0, 100)}`,
                    null,
                    {
                        folderId,
                        projectId,
                        folderName: folderName.substring(0, 100),
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accFolderId: folderId,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría de creación de carpeta:', error);
            }

            // Crear recurso en accResources y asignar permisos por defecto
            try {
                // Obtener el recurso del proyecto para obtener su ID
                const proyectoRecurso = await this.accResourcesRepository.obtenerRecursoPorExternalId(projectId);
                
                if (proyectoRecurso && proyectoRecurso.id) {
                    // Crear o obtener el recurso de la carpeta
                    const recursoResult = await this.accResourcesRepository.crearRecurso({
                        external_id: folderId,
                        resource_type: 'folder',
                        name: folderName.substring(0, 255),
                        parent_id: proyectoRecurso.id, // La carpeta es hija del proyecto
                        account_id: undefined,
                        idUsuarioCreacion: userId,
                    });

                    // Si el recurso se creó/obtuvo exitosamente, asignar permisos a todos los usuarios con acceso al proyecto
                    if (recursoResult && recursoResult.success && recursoResult.id) {
                        try {
                            // Obtener todos los usuarios con acceso al proyecto
                            const usuariosProyecto = await this.accResourcesRepository.listarUsuariosRecurso(proyectoRecurso.id);
                            
                            // Asignar permiso a cada usuario que tiene acceso al proyecto
                            if (usuariosProyecto.data && Array.isArray(usuariosProyecto.data)) {
                                for (const usuario of usuariosProyecto.data) {
                                    try {
                                        await this.accResourcesRepository.asignarPermisoUsuario({
                                            user_id: usuario.userid,
                                            resource_id: recursoResult.id,
                                            idUsuarioCreacion: userId,
                                        });
                                    } catch (permisoError) {
                                        // No fallar si el permiso ya existe
                                        console.warn(`Error asignando permiso a usuario ${usuario.userid}:`, permisoError);
                                    }
                                }
                            }
                        } catch (permisosError) {
                            // No fallar la operación si la asignación de permisos falla
                            console.warn('Error asignando permisos por defecto a la carpeta:', permisosError);
                        }
                    }
                }
            } catch (recursoError) {
                // No fallar la operación si la creación del recurso falla
                console.warn('Error creando recurso de la carpeta:', recursoError);
            }
        }

        return resultado;
    }
}
