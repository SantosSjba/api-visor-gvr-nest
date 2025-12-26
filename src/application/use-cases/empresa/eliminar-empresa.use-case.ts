import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { EMPRESA_REPOSITORY } from '../../../domain/repositories/empresa.repository.interface';

@Injectable()
export class EliminarEmpresaUseCase {
    constructor(
        @Inject(EMPRESA_REPOSITORY)
        private readonly empresaRepository: IEmpresaRepository,
    ) { }

    async execute(idEmpresa: number, idUsuarioModificacion: number) {
        const resultado = await this.empresaRepository.eliminarEmpresa(idEmpresa, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al eliminar la empresa');
        }

        return {
            message: resultado.message,
        };
    }
}
