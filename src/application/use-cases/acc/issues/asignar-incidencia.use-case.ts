import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../../domain/repositories/acc-recursos.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { BroadcastService } from '../../../../shared/services/broadcast.service';
import { AsignarIncidenciaDto } from '../../../dtos/acc/issues/asignar-incidencia.dto';

@Injectable()
export class AsignarIncidenciaUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
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
                // Obtener usuarios actualmente asignados
                const usuariosActualesData = await this.accRecursosRepository.obtenerUsuariosAsignadosIncidencia(dto.issueId);
                const usuariosActualesIds = usuariosActualesData?.data?.map((u: any) => u.userId) || [];
                
                // Identificar usuarios que deben desasignarse (están asignados pero no en la nueva lista)
                const usuariosADesasignar = usuariosActualesIds.filter((id: number) => !userIds.includes(id));
                
                // Desasignar usuarios que no están en la nueva lista
                if (usuariosADesasignar.length > 0) {
                    await this.accRecursosRepository.desasignarUsuariosIncidencia(
                        dto.issueId,
                        usuariosADesasignar,
                        userId,
                    );
                }
                
                // Asignar usuarios (solo los que no estaban ya asignados)
                resultado = await this.accRecursosRepository.asignarUsuariosIncidencia(
                    dto.issueId,
                    projectId,
                    userIds,
                    userId,
                    userId,
                );
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

        // Emitir notificaciones a los usuarios asignados
        if (usuariosAsignados.length > 0 && usuariosAsignadosData?.data) {
            try {
                const recursoActualizado = await this.accRecursosRepository.obtenerRecurso('issue', dto.issueId);
                
                usuariosAsignados.forEach((userIdAsignado) => {
                    const usuarioAsignado = usuariosAsignadosData.data.find((u: any) => u.userId === userIdAsignado);
                    
                    if (usuarioAsignado) {
                        const notification = {
                            type: 'issue_assigned',
                            title: 'Incidencia Asignada',
                            message: `Te han asignado una incidencia`,
                            issueId: dto.issueId,
                            projectId: projectId,
                            assignedBy: {
                                id: userId,
                                name: recursoActualizado?.usuario_modifico || 'Usuario desconocido',
                            },
                            assignedTo: {
                                id: userIdAsignado,
                                name: usuarioAsignado.usuario || 'Usuario desconocido',
                            },
                            issueTitle: recursoActualizado?.nombre || 'Incidencia',
                            timestamp: new Date().toISOString(),
                        };

                        this.broadcastService.emitNotificationToUser(userIdAsignado, notification);
                    }
                });
            } catch (error) {
                // No fallar la operación si la notificación falla
                console.error('Error al emitir notificaciones:', error);
            }
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

