import { Injectable, Inject } from '@nestjs/common';
import type { IEmpresaRepository, ListarEmpresasParams } from '../../../domain/repositories/empresa.repository.interface';
import { EMPRESA_REPOSITORY } from '../../../domain/repositories/empresa.repository.interface';

@Injectable()
export class ListarEmpresasUseCase {
    constructor(
        @Inject(EMPRESA_REPOSITORY)
        private readonly empresaRepository: IEmpresaRepository,
    ) { }

    async execute(params: ListarEmpresasParams) {
        return await this.empresaRepository.listarEmpresas(params);
    }
}
