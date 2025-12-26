import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { CreateRolDto } from '../../dtos/rol/create-rol.dto';

@Injectable()
export class CrearRolUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
    ) { }

    async execute(createDto: CreateRolDto, idUsuarioCreacion: number) {
        const resultado = await this.rolRepository.crearRol({
            ...createDto,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear el rol');
        }

        return {
            message: resultado.message,
            id_rol: resultado.id_rol,
        };
    }
}
