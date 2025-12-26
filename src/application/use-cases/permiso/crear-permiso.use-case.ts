import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IPermisoRepository } from '../../../domain/repositories/permiso.repository.interface';
import { PERMISO_REPOSITORY } from '../../../domain/repositories/permiso.repository.interface';
import { CreatePermisoDto } from '../../dtos/permiso/create-permiso.dto';

@Injectable()
export class CrearPermisoUseCase {
    constructor(
        @Inject(PERMISO_REPOSITORY)
        private readonly permisoRepository: IPermisoRepository,
    ) { }

    async execute(createDto: CreatePermisoDto, idUsuarioCreacion: number) {
        const resultado = await this.permisoRepository.crearPermiso({
            ...createDto,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear el permiso');
        }

        return {
            message: resultado.message,
            id_permiso: resultado.id_permiso,
        };
    }
}
