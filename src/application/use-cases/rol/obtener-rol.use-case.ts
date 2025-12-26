import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';

@Injectable()
export class ObtenerRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number) {
        const rol = await this.rolRepository.obtenerRolPorId(idRol);

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        return rol;
    }
}
