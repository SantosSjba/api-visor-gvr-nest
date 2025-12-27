import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ActualizarRecursoDto } from '../../../dtos/acc/resources/actualizar-recurso.dto';

@Injectable()
export class ActualizarRecursoUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(id: number, dto: ActualizarRecursoDto, idUsuarioModificacion: number) {
        const resultado = await this.accResourcesRepository.actualizarRecurso(id, {
            name: dto.name,
            parent_id: dto.parent_id,
            account_id: dto.account_id,
            idUsuarioModificacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al actualizar el recurso');
        }

        return {
            message: resultado.message,
        };
    }
}

