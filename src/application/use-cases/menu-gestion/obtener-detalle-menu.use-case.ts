import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';

@Injectable()
export class ObtenerDetalleMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number) {
        const menu = await this.menuRepository.obtenerDetalleMenu(idMenu);

        if (!menu) {
            throw new NotFoundException('Menú no encontrado');
        }

        return menu;
    }
}
