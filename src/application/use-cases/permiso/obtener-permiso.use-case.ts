import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IPermisoRepository } from '../../../domain/repositories/permiso.repository.interface';
import { PERMISO_REPOSITORY } from '../../../domain/repositories/permiso.repository.interface';

@Injectable()
export class ObtenerPermisoUseCase {
    constructor(
        @Inject(PERMISO_REPOSITORY)
        private readonly permisoRepository: IPermisoRepository,
    ) { }

    async execute(idPermiso: number) {
        const permiso = await this.permisoRepository.obtenerPermisoPorId(idPermiso);

        if (!permiso) {
            throw new NotFoundException('Permiso no encontrado');
        }

        return permiso;
    }
}
