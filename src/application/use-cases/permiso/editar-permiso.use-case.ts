import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IPermisoRepository } from '../../../domain/repositories/permiso.repository.interface';
import { PERMISO_REPOSITORY } from '../../../domain/repositories/permiso.repository.interface';
import { UpdatePermisoDto } from '../../dtos/permiso/update-permiso.dto';

@Injectable()
export class EditarPermisoUseCase {
    constructor(
        @Inject(PERMISO_REPOSITORY)
        private readonly permisoRepository: IPermisoRepository,
    ) { }

    async execute(idPermiso: number, updateDto: UpdatePermisoDto, idUsuarioModificacion: number) {
        const resultado = await this.permisoRepository.editarPermiso({
            idPermiso,
            ...updateDto,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al editar el permiso');
        }

        return {
            message: resultado.message,
        };
    }
}
