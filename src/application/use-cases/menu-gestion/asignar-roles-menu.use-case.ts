import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { AsignarRolesMenuDto } from '../../dtos/menu-gestion/asignar-roles-menu.dto';

@Injectable()
export class AsignarRolesMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, asignarDto: AsignarRolesMenuDto, idUsuarioCreacion: number) {
        const resultado = await this.menuRepository.asignarRolesMenu({
            idMenu,
            roles: asignarDto.roles,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al asignar los roles');
        }

        return {
            message: resultado.message,
        };
    }
}
