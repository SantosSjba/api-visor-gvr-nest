import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';

@Injectable()
export class EliminarRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number, idUsuarioModificacion: number) {
        const resultado = await this.rolRepository.eliminarRol(idRol, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al eliminar el rol');
        }

        return {
            message: resultado.message,
        };
    }
}
