import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';

@Injectable()
export class EliminarMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, idUsuarioModificacion: number) {
        const resultado = await this.menuRepository.eliminarMenu(idMenu, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al eliminar el menú');
        }

        return {
            message: resultado.message,
        };
    }
}
