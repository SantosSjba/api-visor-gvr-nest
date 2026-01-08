import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { SincronizarPermisosUsuarioDto } from '../../../dtos/acc/resources/sincronizar-permisos-usuario.dto';

@Injectable()
export class SincronizarPermisosUsuarioUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: SincronizarPermisosUsuarioDto, idUsuarioModificacion: number) {
        const resultado = await this.accResourcesRepository.sincronizarPermisosUsuario({
            user_id: dto.user_id,
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

