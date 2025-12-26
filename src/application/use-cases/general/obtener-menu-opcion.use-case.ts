import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMenuRepository } from '../../../domain/repositories/menu.repository.interface';
import { MENU_REPOSITORY } from '../../../domain/repositories/menu.repository.interface';

@Injectable()
export class ObtenerMenuOpcionUseCase {
    constructor(
        @Inject(MENU_REPOSITORY)
        private readonly menuRepository: IMenuRepository,
    ) { }

    async execute(id: number): Promise<any> {
        const menuOpcion = await this.menuRepository.obtenerMenuOpcionPorId(id);

        if (!menuOpcion) {
            throw new NotFoundException('Opción de menú no encontrada');
        }

        return menuOpcion;
    }
}
