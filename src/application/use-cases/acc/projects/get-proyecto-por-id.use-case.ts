import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GetProyectoPorIdDto } from '../../../dtos/acc/projects/get-proyecto-por-id.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class GetProyectoPorIdUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(projectId: string, dto: GetProyectoPorIdDto): Promise<any> {
        const fields = dto.fields ? dto.fields.split(',').map(f => f.trim()) : [];

        const resultado = await this.autodeskApiService.getAccProjectById(
            projectId,
            fields,
            dto.token,
        );

        // Enriquecer proyecto con información de auditoría
        if (resultado) {
            try {
                // Buscar en auditoría el registro de creación de este proyecto
                const registroCreacion = await this.auditoriaRepository.obtenerAuditoriaPorMetadatos(
                    'project',
                    'PROJECT_CREATE',
                    'accProjectId',
                    projectId,
                );

                if (registroCreacion && registroCreacion.usuario) {
                    return {
                        ...resultado,
                        createdByReal: registroCreacion.usuario,
                        createdByRealId: registroCreacion.idusuario,
                        createdByRealRole: registroCreacion.rol || null,
                    };
                }
            } catch (error) {
                // Si falla la búsqueda, retornar proyecto original
            }
        }

        return resultado;
    }
}
