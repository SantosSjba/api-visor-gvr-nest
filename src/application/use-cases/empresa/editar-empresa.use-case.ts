import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { EMPRESA_REPOSITORY } from '../../../domain/repositories/empresa.repository.interface';
import { UpdateEmpresaDto } from '../../dtos/empresa/update-empresa.dto';

@Injectable()
export class EditarEmpresaUseCase {
    constructor(
        @Inject(EMPRESA_REPOSITORY)
        private readonly empresaRepository: IEmpresaRepository,
    ) { }

    async execute(idEmpresa: number, updateDto: UpdateEmpresaDto, idUsuarioModificacion: number) {
        const resultado = await this.empresaRepository.editarEmpresa({
            idEmpresa,
            ...updateDto,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al editar la empresa');
        }

        return {
            message: resultado.message,
        };
    }
}
