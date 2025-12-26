import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { ReordenarMenuDto } from '../../dtos/menu-gestion/reordenar-menu.dto';

@Injectable()
export class ReordenarMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, reordenarDto: ReordenarMenuDto, idUsuarioModificacion: number) {
        const resultado = await this.menuRepository.reordenarMenu({
            idMenu,
            ordenNuevo: reordenarDto.orden_nuevo,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al reordenar el menú');
        }

        return {
            message: resultado.message,
        };
    }
}
