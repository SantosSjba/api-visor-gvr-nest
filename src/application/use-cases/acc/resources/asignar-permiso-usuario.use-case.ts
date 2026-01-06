import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { AsignarPermisoUsuarioDto } from '../../../dtos/acc/resources/asignar-permiso-usuario.dto';

@Injectable()
export class AsignarPermisoUsuarioUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: AsignarPermisoUsuarioDto, idUsuarioCreacion: number) {
        const resultado = await this.accResourcesRepository.asignarPermisoUsuario({
            user_id: dto.user_id,
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

