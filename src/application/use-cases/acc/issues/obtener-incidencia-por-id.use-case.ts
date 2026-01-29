import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../../domain/repositories/acc-recursos.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class ObtenerIncidenciaPorIdUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
    ) { }

    async execute(userId: number, projectId: string, issueId: string): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
        const resultado = await this.autodeskApiService.obtenerIncidenciaPorId(accessToken, projectId, issueId);

        if (!resultado || !resultado.id) {
            return resultado;
        }

        try {
            // Buscar en auditoría el registro de creación de esta incidencia
            const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                'issue',
                'ISSUE_CREATE',
                'accIssueId',
                resultado.id,
            );

            // Buscar asignaciones múltiples de la incidencia
            const usuariosAsignados = await this.accRecursosRepository.obtenerUsuariosAsignadosIncidencia(resultado.id);

            let issueEnriquecida: any = { ...resultado };

            // Agregar información del creador real
            if (registroCreacion && registroCreacion.usuario) {
                issueEnriquecida = {
                    ...issueEnriquecida,
                    createdByReal: registroCreacion.usuario,
                    createdByRealId: registroCreacion.idusuario,
                    createdByRealRole: registroCreacion.rol || null,
                    createdByAcc: resultado.createdBy,
                };
            }

            // Agregar información de usuarios asignados (múltiples)
            if (usuariosAsignados && usuariosAsignados.success && usuariosAsignados.data && usuariosAsignados.data.length > 0) {
                const usuarios = usuariosAsignados.data;
                // Mantener compatibilidad: usar el primer usuario asignado para campos legacy
                const primerUsuario = usuarios[0];
                issueEnriquecida = {
                    ...issueEnriquecida,
                    assignedToReal: primerUsuario.usuario,
                    assignedToRealId: primerUsuario.userId,
                    assignedToRealRole: primerUsuario.rol || null,
                    // Nuevos campos para múltiples asignaciones
                    assignedToRealMultiple: usuarios.map((u: any) => ({
                        userId: u.userId,
                        usuario: u.usuario,
                        correo: u.correo,
                        fotoPerfil: u.fotoPerfil || null,
                        rol: u.rol,
                        fechaAsignacion: u.fechaAsignacion,
                    })),
                    assignedToRealIds: usuarios.map((u: any) => u.userId),
                };
            }

            return issueEnriquecida;
        } catch (error) {
            // Si falla el enriquecimiento, retornar resultado original
            return resultado;
        }
    }
}


