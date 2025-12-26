import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { ClonarMenuDto } from '../../dtos/menu-gestion/clonar-menu.dto';

@Injectable()
export class ClonarMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, cloneDto: ClonarMenuDto, idUsuarioCreacion: number) {
        const resultado = await this.menuRepository.clonarMenu({
            idMenu,
            nombreNuevo: cloneDto.nombre_nuevo,
            idPadreNuevo: cloneDto.id_padre_nuevo,
            clonarRoles: cloneDto.clonar_roles ?? true,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al clonar el menú');
        }

        return {
            message: resultado.message,
            id_menu_nuevo: resultado.id_menu_nuevo,
        };
    }
}
