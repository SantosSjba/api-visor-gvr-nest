import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { AsignarPermisosDto } from '../../dtos/rol/asignar-permisos.dto';

@Injectable()
export class AsignarPermisosRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number, asignarDto: AsignarPermisosDto, idUsuarioCreacion: number) {
        const resultado = await this.rolRepository.asignarPermisosRol({
            idRol,
            permisos: asignarDto.permisos,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al asignar los permisos');
        }

        return {
            message: resultado.message,
        };
    }
}
