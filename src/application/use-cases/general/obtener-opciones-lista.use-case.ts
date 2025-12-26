import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMenuRepository } from '../../../domain/repositories/menu.repository.interface';
import { MENU_REPOSITORY } from '../../../domain/repositories/menu.repository.interface';

@Injectable()
export class ObtenerOpcionesListaUseCase {
    constructor(
        @Inject(MENU_REPOSITORY)
        private readonly menuRepository: IMenuRepository,
    ) { }

    async execute(idLista: number): Promise<any[]> {
        const listaOpciones = await this.menuRepository.obtenerOpcionesPorLista(idLista);

        if (!listaOpciones) {
            throw new NotFoundException('Opciones no encontradas');
        }

        return listaOpciones;
    }
}
