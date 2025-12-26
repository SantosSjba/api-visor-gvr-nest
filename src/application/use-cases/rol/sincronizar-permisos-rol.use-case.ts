import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { AsignarPermisosDto } from '../../dtos/rol/asignar-permisos.dto';

@Injectable()
export class SincronizarPermisosRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(idRol: number, sincronizarDto: AsignarPermisosDto, idUsuarioModificacion: number) {
        const resultado = await this.rolRepository.sincronizarPermisosRol({
            idRol,
            permisos: sincronizarDto.permisos,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al sincronizar los permisos');
        }

        return {
            message: resultado.message,
        };
    }
}
