import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { CrearRecursoDto } from '../../../dtos/acc/resources/crear-recurso.dto';

@Injectable()
export class CrearRecursoUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: CrearRecursoDto, idUsuarioCreacion: number) {
        const resultado = await this.accResourcesRepository.crearRecurso({
            external_id: dto.external_id,
            resource_type: dto.resource_type,
            name: dto.name,
            parent_id: dto.parent_id,
            account_id: dto.account_id,
            idUsuarioCreacion,
        });

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al crear el recurso');
        }

        return {
            id: resultado.id,
            message: resultado.message,
        };
    }
}

