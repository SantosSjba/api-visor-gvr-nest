import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MoverMenuDto } from '../../dtos/menu-gestion/mover-menu.dto';

@Injectable()
export class MoverMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, moverDto: MoverMenuDto, idUsuarioModificacion: number) {
        const resultado = await this.menuRepository.moverMenu({
            idMenu,
            idPadreNuevo: moverDto.id_padre_nuevo,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al mover el menú');
        }

        return {
            message: resultado.message,
        };
    }
}
