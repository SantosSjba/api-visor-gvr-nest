import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAccRepository } from '../../../domain/repositories/acc.repository.interface';
import { ACC_REPOSITORY } from '../../../domain/repositories/acc.repository.interface';

@Injectable()
export class RevocarTokenUseCase {
    constructor(
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(idUsuario: number): Promise<void> {
        // Get user's current token
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(idUsuario);

        if (!token) {
            throw new NotFoundException('No se encontró token activo para este usuario');
        }

        // Revoke the token
        await this.accRepository.revocarToken3Legged(token.id!);
    }
}
