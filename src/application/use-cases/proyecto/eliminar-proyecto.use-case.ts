import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IProyectoRepository } from '../../../domain/repositories/proyecto.repository.interface';
import { PROYECTO_REPOSITORY } from '../../../domain/repositories/proyecto.repository.interface';

@Injectable()
export class EliminarProyectoUseCase {
    constructor(
        @Inject(PROYECTO_REPOSITORY)
        private readonly proyectoRepository: IProyectoRepository,
    ) { }

    async execute(idProyecto: number, idUsuarioModificacion: number) {
        const resultado = await this.proyectoRepository.eliminarProyecto(idProyecto, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al eliminar el proyecto');
        }

        return {
            message: resultado.message,
        };
    }
}
