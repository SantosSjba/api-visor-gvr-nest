import { Injectable, Inject } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';

@Injectable()
export class ListarPermisosDisponiblesUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number) {
        return await this.rolRepository.listarPermisosDisponibles(idRol);
    }
}
