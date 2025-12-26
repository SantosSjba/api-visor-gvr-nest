import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { AsignarRolesMenuDto } from '../../dtos/menu-gestion/asignar-roles-menu.dto';

@Injectable()
export class SincronizarRolesMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, sincronizarDto: AsignarRolesMenuDto, idUsuarioModificacion: number) {
        const resultado = await this.menuRepository.sincronizarRolesMenu({
            idMenu,
            roles: sincronizarDto.roles,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al sincronizar los roles del menú');
        }

        return {
            message: resultado.message,
        };
    }
}
