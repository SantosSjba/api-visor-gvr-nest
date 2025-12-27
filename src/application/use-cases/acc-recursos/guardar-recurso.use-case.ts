import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../domain/repositories/acc-recursos.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';
import { GuardarRecursoDto } from '../../dtos/acc-recursos/guardar-recurso.dto';

@Injectable()
export class GuardarRecursoUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        dto: GuardarRecursoDto,
        idUsuarioCreacion: number,
        ipAddress: string,
        userAgent: string,
    ): Promise<any> {
        if (!dto.recurso_tipo) {
            throw new BadRequestException('El tipo de recurso es requerido');
        }
        if (!dto.recurso_id) {
            throw new BadRequestException('El ID del recurso es requerido');
        }

        const resultado = await this.accRecursosRepository.guardarRecurso(
            dto.recurso_tipo,
            dto.recurso_id,
            dto.recurso_urn || null,
            dto.project_id || null,
            dto.parent_id || null,
            dto.idusuario_creador,
            dto.idusuario_asignado || null,
            dto.nombre || null,
            dto.descripcion || null,
            dto.estado || null,
            dto.metadatos || {},
            idUsuarioCreacion,
        );

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al guardar recurso ACC');
        }

        await this.auditoriaRepository.registrarAccion(
            idUsuarioCreacion,
            'ACC_RESOURCE_CREATE',
            'accrecursosusuarios',
            dto.recurso_id,
            `Recurso ACC tipo '${dto.recurso_tipo}' creado`,
            null,
            {
                recurso_tipo: dto.recurso_tipo,
                recurso_id: dto.recurso_id,
                nombre: dto.nombre,
            },
            ipAddress,
            userAgent,
            { project_id: dto.project_id },
        );

        return {
            success: true,
            message: resultado.message,
            id_recurso: resultado.id_recurso,
        };
    }
}

