import { Injectable, Inject } from '@nestjs/common';
import type { IPermisoRepository, ListarPermisosParams } from '../../../domain/repositories/permiso.repository.interface';
import { PERMISO_REPOSITORY } from '../../../domain/repositories/permiso.repository.interface';

@Injectable()
export class ListarPermisosUseCase {
    constructor(
        @Inject(PERMISO_REPOSITORY)
        private readonly permisoRepository: IPermisoRepository,
    ) { }

    async execute(params: ListarPermisosParams) {
        return await this.permisoRepository.listarPermisos(params);
    }
}
