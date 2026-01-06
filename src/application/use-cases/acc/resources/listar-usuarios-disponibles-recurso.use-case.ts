import { Injectable, Inject } from '@nestjs/common';
import type { IAccResourcesRepository, ListarUsuariosDisponiblesRecursoParams } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ListarUsuariosDisponiblesRecursoDto } from '../../../dtos/acc/resources/listar-usuarios-disponibles-recurso.dto';

@Injectable()
export class ListarUsuariosDisponiblesRecursoUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(resourceId: number, dto: ListarUsuariosDisponiblesRecursoDto) {
        const params: ListarUsuariosDisponiblesRecursoParams = {
            resourceId,
            busqueda: dto.busqueda || '',
            limit: dto.limit || 100,
            offset: dto.offset || 0,
        };

        return await this.accResourcesRepository.listarUsuariosDisponiblesRecurso(params);
    }
}

