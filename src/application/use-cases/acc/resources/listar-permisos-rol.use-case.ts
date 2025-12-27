import { Injectable, Inject } from '@nestjs/common';
import type { IAccResourcesRepository, ListarPermisosRolParams } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ListarPermisosRolDto } from '../../../dtos/acc/resources/listar-permisos-rol.dto';

@Injectable()
export class ListarPermisosRolUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(roleId: number, dto: ListarPermisosRolDto) {
        const params: ListarPermisosRolParams = {
            roleId,
            limit: dto.limit || 100,
            offset: dto.offset || 0,
        };

        return await this.accResourcesRepository.listarPermisosRol(params);
    }
}

