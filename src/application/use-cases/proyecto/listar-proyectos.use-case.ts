import { Injectable, Inject } from '@nestjs/common';
import type { IProyectoRepository, ListarProyectosParams } from '../../../domain/repositories/proyecto.repository.interface';
import { PROYECTO_REPOSITORY } from '../../../domain/repositories/proyecto.repository.interface';

@Injectable()
export class ListarProyectosUseCase {
    constructor(
        @Inject(PROYECTO_REPOSITORY)
        private readonly proyectoRepository: IProyectoRepository,
    ) { }

    async execute(params: ListarProyectosParams) {
        return await this.proyectoRepository.listarProyectos(params);
    }
}
