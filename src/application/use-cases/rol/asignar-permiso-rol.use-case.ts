import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { AsignarPermisoDto } from '../../dtos/rol/asignar-permiso.dto';

@Injectable()
export class AsignarPermisoRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number, asignarDto: AsignarPermisoDto, idUsuarioCreacion: number) {
        const resultado = await this.rolRepository.asignarPermisoRol({
            idRol,
            idPermiso: asignarDto.id_permiso,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al asignar el permiso');
        }

        return {
            message: resultado.message,
        };
    }
}
