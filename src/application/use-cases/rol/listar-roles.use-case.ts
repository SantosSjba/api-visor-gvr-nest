import { Injectable, Inject } from '@nestjs/common';
import type { IRolRepository, ListarRolesParams } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';

@Injectable()
export class ListarRolesUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(params: ListarRolesParams) {
        return await this.rolRepository.listarRoles(params);
    }
}
