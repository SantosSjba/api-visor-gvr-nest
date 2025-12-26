import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { EMPRESA_REPOSITORY } from '../../../domain/repositories/empresa.repository.interface';

@Injectable()
export class ObtenerEmpresaUseCase {
    constructor(
        @Inject(EMPRESA_REPOSITORY)
        private readonly empresaRepository: IEmpresaRepository,
    ) { }

    async execute(idEmpresa: number) {
        const empresa = await this.empresaRepository.obtenerEmpresaPorId(idEmpresa);

        if (!empresa) {
            throw new NotFoundException('Empresa no encontrada');
        }

        return empresa;
    }
}
