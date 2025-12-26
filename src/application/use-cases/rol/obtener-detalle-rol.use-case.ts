import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';

@Injectable()
export class ObtenerDetalleRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number) {
        const detalle = await this.rolRepository.obtenerDetalleRol(idRol);

        if (!detalle) {
            throw new NotFoundException('Rol no encontrado');
        }

        return detalle;
    }
}
