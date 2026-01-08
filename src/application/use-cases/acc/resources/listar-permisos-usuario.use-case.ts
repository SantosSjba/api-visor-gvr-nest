import { Injectable, Inject } from '@nestjs/common';
import type { IAccResourcesRepository, ListarPermisosUsuarioParams } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ListarPermisosUsuarioDto } from '../../../dtos/acc/resources/listar-permisos-usuario.dto';

@Injectable()
export class ListarPermisosUsuarioUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(userId: number, dto: ListarPermisosUsuarioDto) {
        const params: ListarPermisosUsuarioParams = {
            userId,
            limit: dto.limit || 100,
            offset: dto.offset || 0,
        };

        return await this.accResourcesRepository.listarPermisosUsuario(params);
    }
}

