import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IPermisoRepository } from '../../../domain/repositories/permiso.repository.interface';
import { PERMISO_REPOSITORY } from '../../../domain/repositories/permiso.repository.interface';

@Injectable()
export class EliminarPermisoUseCase {
    constructor(
        @Inject(PERMISO_REPOSITORY)
        private readonly permisoRepository: IPermisoRepository,
    ) { }

    async execute(idPermiso: number, idUsuarioModificacion: number) {
        const resultado = await this.permisoRepository.eliminarPermiso(idPermiso, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al eliminar el permiso');
        }

        return {
            message: resultado.message,
        };
    }
}
