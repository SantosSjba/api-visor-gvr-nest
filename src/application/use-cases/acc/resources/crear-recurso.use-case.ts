import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccResourcesRepository } from '../../../../domain/repositories/acc-resources.repository.interface';
import { ACC_RESOURCES_REPOSITORY } from '../../../../domain/repositories/acc-resources.repository.interface';
import { CrearRecursoDto } from '../../../dtos/acc/resources/crear-recurso.dto';
import { normalizeExternalId } from '../../../../shared/utils/normalize-external-id.util';

@Injectable()
export class CrearRecursoUseCase {
    constructor(
        @Inject(ACC_RESOURCES_REPOSITORY)
        private readonly accResourcesRepository: IAccResourcesRepository,
    ) { }

    async execute(dto: CrearRecursoDto, idUsuarioCreacion: number) {
        // Normalizar el external_id (quitar prefijo "b." si existe)
        const normalizedExternalId = normalizeExternalId(dto.external_id);
        
        if (!normalizedExternalId) {
            throw new BadRequestException('El external_id es obligatorio');
        }
        
        const resultado = await this.accResourcesRepository.crearRecurso({
            external_id: normalizedExternalId,
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

