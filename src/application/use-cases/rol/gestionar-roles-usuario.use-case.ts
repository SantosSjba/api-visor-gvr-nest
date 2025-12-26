import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { GestionarRolesUsuarioDto } from '../../dtos/rol/gestionar-roles-usuario.dto';

@Injectable()
export class GestionarRolesUsuarioUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idUsuario: number, gestionarDto: GestionarRolesUsuarioDto, idUsuarioModificacion: number) {
        const resultado = await this.rolRepository.gestionarRolesUsuario(
            idUsuario,
            gestionarDto.rolesIds,
            idUsuarioModificacion
        );

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al gestionar los roles del usuario');
        }

        return {
            message: resultado.message,
        };
    }
}
