import { Injectable, Inject } from '@nestjs/common';
import type { IAccResourcesRepository, ListarRecursosParams } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ListarRecursosDto } from '../../../dtos/acc/resources/listar-recursos.dto';

@Injectable()
export class ListarRecursosUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: ListarRecursosDto) {
        const params: ListarRecursosParams = {
            busqueda: dto.busqueda || '',
            resourceType: dto.resource_type || '',
            limit: dto.limit || 10,
            offset: dto.offset || 0,
        };

        return await this.accResourcesRepository.listarRecursos(params);
    }
}

