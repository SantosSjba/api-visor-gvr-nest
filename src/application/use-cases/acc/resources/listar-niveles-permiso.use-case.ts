import { Injectable, Inject } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';

@Injectable()
export class ListarNivelesPermisoUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute() {
        return await this.accResourcesRepository.listarNivelesPermiso();
    }
}
