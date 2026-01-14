import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ActualizarNivelPermisoUsuarioDto } from '../../../dtos/acc/resources/actualizar-nivel-permiso-usuario.dto';

@Injectable()
export class ActualizarNivelPermisoUsuarioUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(userAccAccessId: number, dto: ActualizarNivelPermisoUsuarioDto, idUsuarioModificacion: number) {
        const resultado = await this.accResourcesRepository.actualizarNivelPermisoUsuario({
            userAccAccessId,
            permission_level_id: dto.permission_level_id,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al actualizar el nivel de permiso');
        }

        return {
            message: resultado.message,
        };
    }
}
