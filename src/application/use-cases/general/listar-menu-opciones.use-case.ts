import { Injectable, Inject } from '@nestjs/common';
import type { IMenuRepository } from '../../../domain/repositories/menu.repository.interface';
import { MENU_REPOSITORY } from '../../../domain/repositories/menu.repository.interface';

@Injectable()
export class ListarMenuOpcionesUseCase {
    constructor(
        @Inject(MENU_REPOSITORY)
        private readonly menuRepository: IMenuRepository,
    ) { }

    async execute(): Promise<any[]> {
        const menuOpciones = await this.menuRepository.listarMenuOpciones();

        // Decode JSON fields if they are strings
        if (menuOpciones) {
            menuOpciones.forEach(menu => {
                if (menu.opciones && typeof menu.opciones === 'string') {
                    try {
                        menu.opciones = JSON.parse(menu.opciones);
                    } catch (e) {
                        // Keep as is if parsing fails
                    }
                }
            });
        }

        return menuOpciones || [];
    }
}
