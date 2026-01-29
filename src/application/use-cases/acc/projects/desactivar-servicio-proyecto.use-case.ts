import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from '../issues/obtener-token-valido.helper';

export interface DesactivarServicioProyectoDto {
    email: string;
    service: string;
    region?: string;
}

@Injectable()
export class DesactivarServicioProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        projectId: string,
        dto: DesactivarServicioProyectoDto,
        userId?: string | number,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        // Obtener token 3-legged del usuario
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

        // Si no tenemos token 3-legged, usar token 2-legged
        if (!accessToken) {
            try {
                const token2Legged = await this.autodeskApiService.obtenerToken2Legged(['account:write', 'account:read']);
                accessToken = token2Legged.access_token;
            } catch (error) {
                throw new UnauthorizedException('No se pudo obtener un token de acceso válido');
            }
        }

        try {
            // Buscar el usuario en el proyecto por email
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

            if (!usuarioExistente?.id) {
                throw new BadRequestException(
                    `El usuario con email ${dto.email} no es miembro de este proyecto`,
                );
            }

            // Obtener los productos actuales del usuario
            const productosActuales = usuarioExistente.products || [];

            // Crear nueva lista de productos sin el servicio a desactivar
            // o estableciendo su access a "none"
            const nuevosProductos = productosActuales.map((p: any) => {
                const normalizedKey = p.key?.replace('autodesk.', '') || p.key;
                const normalizedServiceKey = dto.service.replace('autodesk.', '');

                if (normalizedKey === normalizedServiceKey || p.key === dto.service) {
                    return {
                        key: p.key,
                        access: 'none', // Desactivar el servicio
                    };
                }
                return {
                    key: p.key,
                    access: p.access,
                };
            });

            // Si el servicio es 'docs', también desactivar 'projectAdministration' si lo tiene
            if (dto.service === 'docs' || dto.service === 'autodesk.docs') {
                const idx = nuevosProductos.findIndex((p: any) =>
                    p.key === 'projectAdministration' || p.key === 'autodesk.projectAdministration'
                );
                if (idx !== -1) {
                    nuevosProductos[idx].access = 'none';
                }
            }

            // Actualizar el usuario con los productos modificados
            const resultadoUpdate = await this.autodeskApiService.actualizarUsuarioProyecto(
                accessToken,
                projectId,
                usuarioExistente.id,
                { products: nuevosProductos },
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
                        'PROJECT_SERVICE_DEACTIVATE',
                        'project',
                        null,
                        `Servicio ${dto.service} desactivado en proyecto`,
                        null,
                        {
                            projectId,
                            service: dto.service,
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
                    console.error('Error registrando auditoría de desactivación de servicio:', error);
                }
            }

            return {
                success: true,
                message: `Servicio ${dto.service} desactivado exitosamente`,
                data: resultadoUpdate.data,
            };
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                `Error al desactivar servicio ${dto.service}: ${error.message}`,
            );
        }
    }
}
