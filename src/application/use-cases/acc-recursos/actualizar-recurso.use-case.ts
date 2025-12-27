import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../domain/repositories/acc-recursos.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';
import { ActualizarRecursoDto } from '../../dtos/acc-recursos/actualizar-recurso.dto';

@Injectable()
export class ActualizarRecursoUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        recursoTipo: string,
        recursoId: string,
        dto: ActualizarRecursoDto,
        idUsuarioModificacion: number,
        ipAddress: string,
        userAgent: string,
    ): Promise<any> {
        const recursoActual = await this.accRecursosRepository.obtenerRecurso(recursoTipo, recursoId);

        const datosAnteriores = recursoActual ? {
            idusuario_asignado: recursoActual.idusuario_asignado,
            estado: recursoActual.estado,
        } : null;

        const resultado = await this.accRecursosRepository.actualizarRecurso(
            recursoTipo,
            recursoId,
            dto.idusuario_asignado || null,
            idUsuarioModificacion,
            dto.estado || null,
            dto.metadatos || null,
            idUsuarioModificacion,
        );

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al actualizar recurso ACC');
        }

        const accion = dto.idusuario_asignado ? 'ACC_RESOURCE_ASSIGN' : 'ACC_RESOURCE_UPDATE';
        const descripcion = dto.idusuario_asignado
            ? `Recurso reasignado a usuario ${dto.idusuario_asignado}`
            : 'Recurso actualizado';

        await this.auditoriaRepository.registrarAccion(
            idUsuarioModificacion,
            accion,
            'accrecursosusuarios',
            recursoId,
            descripcion,
            datosAnteriores,
            {
                idusuario_asignado: dto.idusuario_asignado,
                estado: dto.estado,
            },
            ipAddress,
            userAgent,
            { recurso_tipo: recursoTipo },
        );

        return {
            success: true,
            message: resultado.message,
        };
    }
}

