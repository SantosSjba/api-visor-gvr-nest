import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class ObtenerAuditoriaPorIdUseCase {
    constructor(
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(id: number): Promise<any> {
        const auditoria = await this.auditoriaRepository.obtenerAuditoriaPorId(id);

        if (!auditoria) {
            throw new NotFoundException('Auditoría no encontrada');
        }

        return auditoria;
    }
}

