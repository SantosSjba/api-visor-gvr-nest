import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../domain/repositories/acc-recursos.repository.interface';
import { ObtenerRecursosHijosDto } from '../../dtos/acc-recursos/obtener-recursos-hijos.dto';

@Injectable()
export class ObtenerRecursosHijosUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
    ) { }

    async execute(parentId: string, dto: ObtenerRecursosHijosDto): Promise<any> {
        if (!parentId) {
            throw new BadRequestException('El ID del recurso padre es requerido');
        }

        const recursos = await this.accRecursosRepository.obtenerRecursosHijos(
            parentId,
            dto.tipo || null,
        );

        return recursos || [];
    }
}

