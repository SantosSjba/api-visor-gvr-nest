import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { CreateMenuDto } from '../../dtos/menu-gestion/create-menu.dto';

@Injectable()
export class CrearMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(createDto: CreateMenuDto, idUsuarioCreacion: number) {
        const resultado = await this.menuRepository.crearMenu({
            ...createDto,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear el menú');
        }

        return {
            message: resultado.message,
            id_menu: resultado.id_menu,
        };
    }
}
