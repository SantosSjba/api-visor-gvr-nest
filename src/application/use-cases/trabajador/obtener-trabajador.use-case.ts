import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ITrabajadorRepository } from '../../../domain/repositories/trabajador.repository.interface';
import { TRABAJADOR_REPOSITORY } from '../../../domain/repositories/trabajador.repository.interface';

@Injectable()
export class ObtenerTrabajadorUseCase {
    constructor(
        @Inject(TRABAJADOR_REPOSITORY)
        private readonly trabajadorRepository: ITrabajadorRepository,
    ) { }

    async execute(idTrabajador: number) {
        const trabajador = await this.trabajadorRepository.obtenerTrabajadorPorId(idTrabajador);

        if (!trabajador) {
            throw new NotFoundException('Trabajador no encontrado');
        }

        return trabajador;
    }
}
