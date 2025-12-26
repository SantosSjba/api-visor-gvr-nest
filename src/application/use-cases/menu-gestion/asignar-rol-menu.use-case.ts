import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMenuGestionRepository } from '../../../domain/repositories/menu-gestion.repository.interface';
import { MENU_GESTION_REPOSITORY } from '../../../domain/repositories/menu-gestion.repository.interface';
import { AsignarRolMenuDto } from '../../dtos/menu-gestion/asignar-rol-menu.dto';

@Injectable()
export class AsignarRolMenuUseCase {
    constructor(
        @Inject(MENU_GESTION_REPOSITORY)
        private readonly menuRepository: IMenuGestionRepository,
    ) { }

    async execute(idMenu: number, asignarDto: AsignarRolMenuDto, idUsuarioCreacion: number) {
        const resultado = await this.menuRepository.asignarRolMenu({
            idMenu,
            idRol: asignarDto.id_rol,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al asignar el rol');
        }

        return {
            message: resultado.message,
        };
    }
}
