import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IProyectoRepository } from '../../../domain/repositories/proyecto.repository.interface';
import { PROYECTO_REPOSITORY } from '../../../domain/repositories/proyecto.repository.interface';
import { CreateProyectoDto } from '../../dtos/proyecto/create-proyecto.dto';

@Injectable()
export class CrearProyectoUseCase {
    constructor(
        @Inject(PROYECTO_REPOSITORY)
        private readonly proyectoRepository: IProyectoRepository,
    ) { }

    async execute(createDto: CreateProyectoDto, idUsuarioCreacion: number) {
        const resultado = await this.proyectoRepository.crearProyecto({
            ...createDto,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear el proyecto');
        }

        return {
            message: resultado.message,
            id_proyecto: resultado.id_proyecto,
        };
    }
}
