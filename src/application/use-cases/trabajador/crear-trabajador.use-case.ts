import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ITrabajadorRepository } from '../../../domain/repositories/trabajador.repository.interface';
import { TRABAJADOR_REPOSITORY } from '../../../domain/repositories/trabajador.repository.interface';
import { CreateTrabajadorDto } from '../../dtos/trabajador/create-trabajador.dto';

@Injectable()
export class CrearTrabajadorUseCase {
    constructor(
        @Inject(TRABAJADOR_REPOSITORY)
        private readonly trabajadorRepository: ITrabajadorRepository,
    ) { }

    async execute(createDto: CreateTrabajadorDto, idUsuarioCreacion: number) {
        const resultado = await this.trabajadorRepository.crearTrabajador({
            ...createDto,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear el trabajador');
        }

        return {
            message: resultado.message,
            id_trabajador: resultado.id_trabajador,
            id_usuario: resultado.id_usuario,
        };
    }
}
