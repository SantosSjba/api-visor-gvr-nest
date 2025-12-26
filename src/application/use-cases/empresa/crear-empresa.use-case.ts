import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IEmpresaRepository } from '../../../domain/repositories/empresa.repository.interface';
import { EMPRESA_REPOSITORY } from '../../../domain/repositories/empresa.repository.interface';
import { CreateEmpresaDto } from '../../dtos/empresa/create-empresa.dto';

@Injectable()
export class CrearEmpresaUseCase {
    constructor(
        @Inject(EMPRESA_REPOSITORY)
        private readonly empresaRepository: IEmpresaRepository,
    ) { }

    async execute(createDto: CreateEmpresaDto, idUsuarioCreacion: number) {
        const resultado = await this.empresaRepository.crearEmpresa({
            ...createDto,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear la empresa');
        }

        return {
            message: resultado.message,
            id_empresa: resultado.id_empresa,
        };
    }
}
