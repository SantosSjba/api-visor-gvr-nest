import { Injectable, Inject } from '@nestjs/common';
import type { IMenuGestionRepository, ListarMenusParams } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';

@Injectable()
export class ListarMenusUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(params: ListarMenusParams) {
        return await this.menuRepository.listarMenus(params);
    }
}
