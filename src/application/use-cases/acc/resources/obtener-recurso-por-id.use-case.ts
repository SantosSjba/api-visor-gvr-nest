import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';

@Injectable()
export class ObtenerRecursoPorIdUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(id: number) {
        const resultado = await this.accResourcesRepository.obtenerRecursoPorId(id);

        if (!resultado) {
            throw new NotFoundException('Recurso no encontrado');
        }

        return resultado;
    }
}

