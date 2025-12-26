import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { UpdateRolDto } from '../../dtos/rol/update-rol.dto';

@Injectable()
export class EditarRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number, updateDto: UpdateRolDto, idUsuarioModificacion: number) {
        const resultado = await this.rolRepository.editarRol({
            idRol,
            ...updateDto,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al editar el rol');
        }

        return {
            message: resultado.message,
        };
    }
}
