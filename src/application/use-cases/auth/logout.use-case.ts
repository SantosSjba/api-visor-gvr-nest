import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ISesionRepository } from '../../../domain/repositories/sesion.repository.interface';
import { SESION_REPOSITORY } from '../../../domain/repositories/sesion.repository.interface';

@Injectable()
export class LogoutUseCase {
    constructor(
        @Inject(SESION_REPOSITORY)
        private readonly sesionRepository: ISesionRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(token: string): Promise<void> {
        // Validar token para obtener usuario ID
        let payload: any;
        try {
            payload = this.jwtService.verify(token);
        } catch (error) {
            // Si el token es inválido, no hacemos nada (ya está "cerrado")
            return;
        }

        // Obtener sesión por token
        const sesion = await this.sesionRepository.obtenerSesionPorToken(token);

        // Si existe sesión, cerrarla
        if (sesion) {
            await this.sesionRepository.cerrarSesion(sesion.id!, payload.sub);
        }
    }
}
