import { Injectable, Inject } from '@nestjs/common';
import type { ISesionRepository } from '../../../domain/repositories/sesion.repository.interface';
import { SESION_REPOSITORY } from '../../../domain/repositories/sesion.repository.interface';

export interface ValidarSesionResponse {
    valida: boolean;
}

@Injectable()
export class ValidarSesionUseCase {
    constructor(
        @Inject(SESION_REPOSITORY)
        private readonly sesionRepository: ISesionRepository,
    ) { }

    async execute(token: string): Promise<ValidarSesionResponse> {
        try {
            // Obtener sesión por token
            const sesion = await this.sesionRepository.obtenerSesionPorToken(token);

            // Verificar que exista y esté activa
            if (!sesion || sesion.estado !== 1) {
                return { valida: false };
            }

            return { valida: true };
        } catch (error) {
            return { valida: false };
        }
    }
}
