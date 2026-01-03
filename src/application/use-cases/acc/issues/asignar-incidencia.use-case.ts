import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../../domain/repositories/acc-recursos.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { AsignarIncidenciaDto } from '../../../dtos/acc/issues/asignar-incidencia.dto';

@Injectable()
export class AsignarIncidenciaUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        dto: AsignarIncidenciaDto,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
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

        // Actualizar la asignación
        const resultado = await this.accRecursosRepository.actualizarRecurso(
            'issue',
            dto.issueId,
            dto.userId || null, // idUsuarioAsignado (null para desasignar)
            userId, // idUsuarioModifico
            null, // estadoRecurso
            null, // metadatos
            userId, // idUsuarioModificacion
        );

        if (!resultado || resultado.success === false) {
            throw new BadRequestException(
                resultado?.message || 'Error al asignar la incidencia',
            );
        }

        // Registrar en auditoría
        if (ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    dto.userId ? 'ISSUE_ASSIGN' : 'ISSUE_UNASSIGN',
                    'issue_assignment',
                    null,
                    dto.userId
                        ? `Incidencia ${dto.issueId} asignada a usuario ${dto.userId}`
                        : `Incidencia ${dto.issueId} desasignada`,
                    null,
                    {
                        issueId: dto.issueId,
                        projectId,
                        userIdAsignado: dto.userId || null,
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accIssueId: dto.issueId,
                        userIdAsignado: dto.userId || null,
                        rol: userRole || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
            }
        }

        return {
            success: true,
            message: dto.userId
                ? 'Incidencia asignada exitosamente'
                : 'Incidencia desasignada exitosamente',
            data: {
                issueId: dto.issueId,
                userIdAsignado: dto.userId || null,
            },
        };
    }
}

