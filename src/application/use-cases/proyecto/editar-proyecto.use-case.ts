import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IProyectoRepository } from '../../../domain/repositories/proyecto.repository.interface';
import { PROYECTO_REPOSITORY } from '../../../domain/repositories/proyecto.repository.interface';
import { UpdateProyectoDto } from '../../dtos/proyecto/update-proyecto.dto';

@Injectable()
export class EditarProyectoUseCase {
    constructor(
        @Inject(PROYECTO_REPOSITORY)
        private readonly proyectoRepository: IProyectoRepository,
    ) { }

    async execute(idProyecto: number, updateDto: UpdateProyectoDto, idUsuarioModificacion: number) {
        const resultado = await this.proyectoRepository.editarProyecto({
            idProyecto,
            ...updateDto,
            idUsuarioCreacion: idUsuarioModificacion, // Reuse for consistency
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al editar el proyecto');
        }

        return {
            message: resultado.message,
        };
    }
}
