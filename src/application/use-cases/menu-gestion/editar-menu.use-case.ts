import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { UpdateMenuDto } from '../../dtos/menu-gestion/update-menu.dto';

@Injectable()
export class EditarMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, updateDto: UpdateMenuDto, idUsuarioModificacion: number) {
        const resultado = await this.menuRepository.editarMenu({
            idMenu,
            ...updateDto,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al editar el menú');
        }

        return {
            message: resultado.message,
        };
    }
}
