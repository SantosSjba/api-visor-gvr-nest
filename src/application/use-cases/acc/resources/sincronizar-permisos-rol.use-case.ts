import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { SincronizarPermisosRolDto } from '../../../dtos/acc/resources/sincronizar-permisos-rol.dto';

@Injectable()
export class SincronizarPermisosRolUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: SincronizarPermisosRolDto, idUsuarioModificacion: number) {
        const resultado = await this.accResourcesRepository.sincronizarPermisosRol({
            role_id: dto.role_id,
            resource_ids: dto.resource_ids,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al sincronizar los permisos');
        }

        return {
            asignados: resultado.asignados,
            message: resultado.message,
        };
    }
}

