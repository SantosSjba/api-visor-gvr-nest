import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';

@Injectable()
export class RemoverPermisoRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number, idPermiso: number, idUsuarioModificacion: number) {
        const resultado = await this.rolRepository.removerPermisoRol(idRol, idPermiso, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al remover el permiso');
        }

        return {
            message: resultado.message,
        };
    }
}
