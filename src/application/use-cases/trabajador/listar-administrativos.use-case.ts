import { Injectable, Inject } from '@nestjs/common';
import type { ITrabajadorRepository } from '../../../domain/repositories/trabajador.repository.interface';
import { TRABAJADOR_REPOSITORY } from '../../../domain/repositories/trabajador.repository.interface';

@Injectable()
export class ListarAdministrativosUseCase {
    constructor(
        @Inject(TRABAJADOR_REPOSITORY)
        private readonly trabajadorRepository: ITrabajadorRepository,
    ) { }

    async execute() {
        return await this.trabajadorRepository.listarTrabajadoresAdministrativos();
    }
}
