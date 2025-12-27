import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { AsignarPermisoDto } from '../../../dtos/acc/resources/asignar-permiso.dto';

@Injectable()
export class AsignarPermisoUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: AsignarPermisoDto, idUsuarioCreacion: number) {
        const resultado = await this.accResourcesRepository.asignarPermiso({
            role_id: dto.role_id,
            resource_id: dto.resource_id,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al asignar el permiso');
        }

        return {
            id: resultado.id,
            message: resultado.message,
        };
    }
}

