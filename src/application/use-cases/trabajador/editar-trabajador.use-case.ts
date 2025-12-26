import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ITrabajadorRepository } from '../../../domain/repositories/trabajador.repository.interface';
import { TRABAJADOR_REPOSITORY } from '../../../domain/repositories/trabajador.repository.interface';
import { UpdateTrabajadorDto } from '../../dtos/trabajador/update-trabajador.dto';

@Injectable()
export class EditarTrabajadorUseCase {
    constructor(
        @Inject(TRABAJADOR_REPOSITORY)
        private readonly trabajadorRepository: ITrabajadorRepository,
    ) { }

    async execute(idTrabajador: number, updateDto: UpdateTrabajadorDto, idUsuarioModificacion: number) {
        const resultado = await this.trabajadorRepository.editarTrabajador({
            idTrabajador,
            ...updateDto,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al editar el trabajador');
        }

        return {
            message: resultado.message,
        };
    }
}
