import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ISesionRepository } from '../../../domain/repositories/sesion.repository.interface';
import { SESION_REPOSITORY } from '../../../domain/repositories/sesion.repository.interface';

@Injectable()
export class CerrarTodasSesionesUseCase {
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
            throw new UnauthorizedException('Token inválido o expirado');
        }

        const usuarioId = payload.sub;

        // Cerrar todas las sesiones del usuario
        await this.sesionRepository.cerrarTodasLasSesiones(usuarioId, usuarioId);
    }
}
