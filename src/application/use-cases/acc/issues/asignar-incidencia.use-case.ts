import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../../domain/repositories/acc-recursos.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { AUTH_REPOSITORY, type IAuthRepository } from '../../../../domain/repositories/auth.repository.interface';
import { BroadcastService } from '../../../../shared/services/broadcast.service';
import { AsignarIncidenciaDto } from '../../../dtos/acc/issues/asignar-incidencia.dto';

@Injectable()
export class AsignarIncidenciaUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(AUTH_REPOSITORY)
        private readonly authRepository: IAuthRepository,
        private readonly broadcastService: BroadcastService,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        dto: AsignarIncidenciaDto,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        // Determinar si usar el nuevo sistema (userIds) o el antiguo (userId) para compatibilidad
        const usarNuevoSistema = dto.userIds !== undefined;
        const userIds = usarNuevoSistema ? dto.userIds! : (dto.userId !== null && dto.userId !== undefined ? [dto.userId] : []);

        // Verificar si el recurso ya existe
        let recurso = await this.accRecursosRepository.obtenerRecurso('issue', dto.issueId);

        if (!recurso) {
            // Si no existe, crearlo primero (sin asignación inicial)
            recurso = await this.accRecursosRepository.guardarRecurso(
                'issue',
                dto.issueId,
                null, // recursoUrn
                projectId,
                null, // parentId
                null, // idUsuarioCreador (se puede actualizar después)
                null, // idUsuarioAsignado (se asignará después)
                null, // nombre
                null, // descripcion
                null, // estadoRecurso
                {}, // metadatos
                userId, // idUsuarioCreacion
            );

            if (!recurso || recurso.success === false) {
                throw new BadRequestException(
                    recurso?.message || 'Error al crear el registro de asignación',
                );
            }
        }

        // Obtener usuarios asignados ANTES de hacer cambios (para comparar después)
        const usuariosAnterioresData = await this.accRecursosRepository.obtenerUsuariosAsignadosIncidencia(dto.issueId);
        const usuariosAnterioresIds = usuariosAnterioresData?.data?.map((u: any) => u.userId) || [];

        let resultado: any;
        let usuariosAsignados: number[] = [];

        if (usarNuevoSistema) {
            // Nuevo sistema: asignaciones múltiples
            if (!userIds || userIds.length === 0) {
                // Desasignar todos los usuarios - pasar null explícitamente
                resultado = await this.accRecursosRepository.desasignarUsuariosIncidencia(
                    dto.issueId,
                    null, // null = desasignar todos
                    userId,
                );
                usuariosAsignados = []; // Asegurar que esté vacío
            } else {
                // Identificar usuarios que deben desasignarse (están asignados pero no en la nueva lista)
                const usuariosADesasignar = usuariosAnterioresIds.filter((id: number) => !userIds.includes(id));
                
                // Desasignar usuarios que no están en la nueva lista
                if (usuariosADesasignar.length > 0) {
                    await this.accRecursosRepository.desasignarUsuariosIncidencia(
                        dto.issueId,
                        usuariosADesasignar,
                        userId,
                    );
                }
                
                // Identificar usuarios nuevos que deben asignarse (están en la nueva lista pero no estaban asignados)
                const usuariosNuevos = userIds.filter((id: number) => !usuariosAnterioresIds.includes(id));
                
                // Asignar solo los usuarios nuevos
                if (usuariosNuevos.length > 0) {
                    resultado = await this.accRecursosRepository.asignarUsuariosIncidencia(
                        dto.issueId,
                        projectId,
                        usuariosNuevos,
                        userId,
                        userId,
                    );
                } else {
                    // Si no hay usuarios nuevos, el resultado es exitoso (solo se desasignaron)
                    resultado = { success: true, message: 'Usuarios desasignados correctamente' };
                }
                usuariosAsignados = userIds;
            }
        } else {
            // Sistema antiguo: compatibilidad con un solo usuario
            if (dto.userId === null || dto.userId === undefined) {
                // Desasignar todos
                resultado = await this.accRecursosRepository.desasignarUsuariosIncidencia(
                    dto.issueId,
                    null,
                    userId,
                );
            } else {
                // Asignar un solo usuario (usar nuevo sistema internamente)
                resultado = await this.accRecursosRepository.asignarUsuariosIncidencia(
                    dto.issueId,
                    projectId,
                    [dto.userId],
                    userId,
                    userId,
                );
                usuariosAsignados = [dto.userId];
            }
        }

        if (!resultado || resultado.success === false) {
            throw new BadRequestException(
                resultado?.message || 'Error al asignar la incidencia',
            );
        }

        // Obtener usuarios asignados actualizados
        const usuariosAsignadosData = await this.accRecursosRepository.obtenerUsuariosAsignadosIncidencia(dto.issueId);

        // Registrar en auditoría
        if (ipAddress && userAgent) {
            try {
                const esAsignacion = usuariosAsignados.length > 0;
                const usuariosAsignadosIds = usuariosAsignadosData?.data?.map((u: any) => u.userId) || usuariosAsignados;
                
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    esAsignacion ? 'ISSUE_ASSIGN' : 'ISSUE_UNASSIGN',
                    'issue_assignment',
                    null,
                    esAsignacion
                        ? `Incidencia ${dto.issueId} asignada a ${usuariosAsignadosIds.length} usuario(s)`
                        : `Incidencia ${dto.issueId} desasignada`,
                    null,
                    {
                        issueId: dto.issueId,
                        projectId,
                        userIdsAsignados: usuariosAsignadosIds,
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accIssueId: dto.issueId,
                        userIdsAsignados: usuariosAsignadosIds,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
                console.error('Error registrando auditoría:', error);
            }
        }

        // Emitir notificaciones a los usuarios afectados
        try {
            const recursoActualizado = await this.accRecursosRepository.obtenerRecurso('issue', dto.issueId);
            const usuariosAsignadosActualesIds = usuariosAsignadosData?.data?.map((u: any) => u.userId) || [];
            
            // Obtener información del usuario que hace la asignación (usuario actual)
            let usuarioAsignador: { nombre: string; fotoPerfil: string | null } = { nombre: 'Usuario', fotoPerfil: null };
            try {
                const perfilAsignador = await this.authRepository.obtenerPerfilUsuario(userId);
                if (perfilAsignador) {
                    usuarioAsignador = {
                        nombre: perfilAsignador.nombre || 'Usuario',
                        fotoPerfil: perfilAsignador.fotoperfil || perfilAsignador.fotoPerfil || null,
                    };
                }
            } catch (err) {
                console.warn('No se pudo obtener el perfil del usuario asignador:', err);
            }
            
            // Identificar usuarios nuevos (asignados ahora pero no antes)
            const usuariosNuevosIds = usuariosAsignadosActualesIds.filter(
                (id: number) => !usuariosAnterioresIds.includes(id)
            );
            
            // Identificar usuarios desasignados (estaban antes pero no ahora)
            const usuariosDesasignadosIds = usuariosAnterioresIds.filter(
                (id: number) => !usuariosAsignadosActualesIds.includes(id)
            );
            
            // Enviar notificaciones a usuarios recién asignados
            if (usuariosNuevosIds.length > 0 && usuariosAsignadosData?.data) {
                usuariosNuevosIds.forEach((userIdAsignado: number) => {
                    const usuarioAsignado = usuariosAsignadosData.data.find((u: any) => u.userId === userIdAsignado);
                    
                    if (usuarioAsignado) {
                        const notification = {
                            type: 'issue_assigned',
                            title: 'Incidencia Asignada',
                            message: `te ha asignado la incidencia`,
                            issueId: dto.issueId,
                            projectId: projectId,
                            assignedBy: {
                                id: userId,
                                name: usuarioAsignador.nombre,
                                fotoPerfil: usuarioAsignador.fotoPerfil,
                            },
                            assignedTo: {
                                id: userIdAsignado,
                                name: usuarioAsignado.usuario || 'Usuario',
                                fotoPerfil: usuarioAsignado.fotoPerfil || null,
                            },
                            issueTitle: recursoActualizado?.nombre || 'Incidencia',
                            timestamp: new Date().toISOString(),
                        };

                        this.broadcastService.emitNotificationToUser(userIdAsignado, notification);
                    }
                });
            }
            
            // Enviar notificaciones a usuarios desasignados
            // Esto cubre tanto desasignaciones parciales como totales
            if (usuariosDesasignadosIds.length > 0) {
                usuariosDesasignadosIds.forEach((userIdDesasignado: number) => {
                    // Buscar el nombre del usuario desasignado en los datos anteriores
                    const usuarioDesasignado = usuariosAnterioresData?.data?.find((u: any) => u.userId === userIdDesasignado);
                    
                    const notification = {
                        type: 'issue_unassigned',
                        title: 'Incidencia Desasignada',
                        message: `te ha desasignado de la incidencia`,
                        issueId: dto.issueId,
                        projectId: projectId,
                        unassignedBy: {
                            id: userId,
                            name: usuarioAsignador.nombre,
                            fotoPerfil: usuarioAsignador.fotoPerfil,
                        },
                        unassignedTo: {
                            id: userIdDesasignado,
                            name: usuarioDesasignado?.usuario || 'Usuario',
                            fotoPerfil: usuarioDesasignado?.fotoPerfil || null,
                        },
                        issueTitle: recursoActualizado?.nombre || 'Incidencia',
                        timestamp: new Date().toISOString(),
                    };

                    this.broadcastService.emitNotificationToUser(userIdDesasignado, notification);
                });
            }
        } catch (error) {
            // No fallar la operación si la notificación falla
            console.error('Error al emitir notificaciones:', error);
        }

        const usuariosAsignadosIds = usuariosAsignadosData?.data?.map((u: any) => u.userId) || usuariosAsignados;

        return {
            success: true,
            message: usuariosAsignados.length > 0
                ? `Incidencia asignada a ${usuariosAsignados.length} usuario(s) exitosamente`
                : 'Incidencia desasignada exitosamente',
            data: {
                issueId: dto.issueId,
                userIdsAsignados: usuariosAsignadosIds,
                usuariosAsignados: usuariosAsignadosData?.data || [],
            },
        };
    }
}

