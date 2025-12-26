import { Injectable, Inject } from '@nestjs/common';
import type { ITrabajadorRepository, ListarTrabajadoresParams } from '../../../domain/repositories/trabajador.repository.interface';
import { TRABAJADOR_REPOSITORY } from '../../../domain/repositories/trabajador.repository.interface';

@Injectable()
export class ListarTrabajadoresUseCase {
    constructor(
        @Inject(TRABAJADOR_REPOSITORY)
        private readonly trabajadorRepository: ITrabajadorRepository,
    ) { }

    async execute(params: ListarTrabajadoresParams) {
        return await this.trabajadorRepository.listarTrabajadores(params);
    }
}
