import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ACC_RECURSOS_REPOSITORY, type IAccRecursosRepository } from '../../../domain/repositories/acc-recursos.repository.interface';

@Injectable()
export class ObtenerRecursoUseCase {
    constructor(
        @Inject(ACC_RECURSOS_REPOSITORY)
        private readonly accRecursosRepository: IAccRecursosRepository,
    ) { }

    async execute(recursoTipo: string, recursoId: string): Promise<any> {
        if (!recursoTipo || !recursoId) {
            throw new BadRequestException('Tipo de recurso e ID son requeridos');
        }

        const recurso = await this.accRecursosRepository.obtenerRecurso(recursoTipo, recursoId);

        if (!recurso) {
            throw new NotFoundException('Recurso no encontrado');
        }

        return recurso;
    }
}

