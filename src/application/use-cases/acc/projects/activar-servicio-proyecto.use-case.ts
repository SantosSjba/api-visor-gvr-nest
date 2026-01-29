import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActivarServicioProyectoDto } from '../../../dtos/acc/projects/activar-servicio-proyecto.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from '../issues/obtener-token-valido.helper';

@Injectable()
export class ActivarServicioProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        projectId: string,
        dto: ActivarServicioProyectoDto,
        userId?: string | number,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        // Obtener token 3-legged del usuario (necesario para operaciones de admin de proyecto)
        let accessToken: string | null = null;

        if (userId) {
            try {
                const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
                if (!isNaN(numericUserId)) {
                    accessToken = await this.obtenerTokenValidoHelper.execute(numericUserId);
                }
            } catch (error) {
                console.warn('No se pudo obtener token 3-legged para el usuario:', userId, error.message);
            }
        }

        // Si no tenemos token 3-legged, usar token 2-legged con scopes de escritura
        if (!accessToken) {
            try {
                const token2Legged = await this.autodeskApiService.obtenerToken2Legged(['account:write', 'account:read']);
                accessToken = token2Legged.access_token;
            } catch (error) {
                throw new UnauthorizedException('No se pudo obtener un token de acceso válido para activar el servicio');
            }
        }

        // Preparar datos del usuario con el producto/servicio a activar
        const userData: Record<string, any> = {
            email: dto.email,
            products: [
                {
                    key: dto.service,
                    access: dto.accessLevel || 'administrator',
                },
            ],
        };

        // Si el servicio es 'docs', también debemos agregar 'projectAdministration' para asegurar acceso completo
        if (dto.service === 'docs') {
            userData.products.push({
                key: 'projectAdministration',
                access: dto.accessLevel || 'administrator',
            });
        }

        try {
            // Intentar agregar el usuario al proyecto con el servicio
            const resultado = await this.autodeskApiService.agregarUsuarioProyecto(
                accessToken,
                projectId,
                userData,
                dto.region,
            );

            // Registrar auditoría
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

            if (numericUserId && ipAddress && userAgent) {
                try {
                    await this.auditoriaRepository.registrarAccion(
                        numericUserId,
                        'PROJECT_SERVICE_ACTIVATE',
                        'project',
                        null,
                        `Servicio ${dto.service} activado en proyecto`,
                        null,
                        {
                            projectId,
                            service: dto.service,
                            accessLevel: dto.accessLevel || 'administrator',
                            adminEmail: dto.email,
                        },
                        ipAddress,
                        userAgent,
                        {
                            accProjectId: projectId,
                            rol: userRole || null,
                        },
                    );
                } catch (error) {
                    console.error('Error registrando auditoría de activación de servicio:', error);
                }
            }

            return {
                success: true,
                message: `Servicio ${dto.service} activado exitosamente en el proyecto`,
                data: resultado.data,
            };
        } catch (error: any) {
            // Si el error es porque el usuario ya existe en el proyecto, intentar actualizar
            if (error.message?.includes('already exists') || error.message?.includes('ya existe')) {
                try {
                    // Primero necesitamos obtener el userId del usuario en el proyecto
                    const usuariosResponse = await this.autodeskApiService.obtenerUsuariosProyecto(
                        accessToken,
                        projectId,
                        { 'filter[email]': dto.email, limit: '1' },
                        dto.region,
                    );

                    const usuarios = usuariosResponse?.data?.results || usuariosResponse?.results || [];
                    const usuarioExistente = usuarios.find((u: any) => 
                        u.email?.toLowerCase() === dto.email.toLowerCase()
                    );

                    if (usuarioExistente?.id) {
                        // Actualizar el usuario con el nuevo producto
                        const resultadoUpdate = await this.autodeskApiService.actualizarUsuarioProyecto(
                            accessToken,
                            projectId,
                            usuarioExistente.id,
                            { products: userData.products },
                            dto.region,
                        );

                        return {
                            success: true,
                            message: `Servicio ${dto.service} actualizado exitosamente para el usuario existente`,
                            data: resultadoUpdate.data,
                        };
                    }
                } catch (updateError: any) {
                    throw new BadRequestException(
                        `Error al actualizar servicio del usuario: ${updateError.message}`,
                    );
                }
            }

            throw new BadRequestException(
                `Error al activar servicio ${dto.service}: ${error.message}`,
            );
        }
    }
}
