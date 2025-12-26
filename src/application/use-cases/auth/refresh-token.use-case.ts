import { Injectable, Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ISesionRepository } from '../../../domain/repositories/sesion.repository.interface';
import { SESION_REPOSITORY } from '../../../domain/repositories/sesion.repository.interface';
import type { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { AUTH_REPOSITORY } from '../../../domain/repositories/auth.repository.interface';

export interface RefreshTokenResponse {
    token: string;
    tipo_token: string;
}

@Injectable()
export class RefreshTokenUseCase {
    constructor(
        @Inject(SESION_REPOSITORY)
        private readonly sesionRepository: ISesionRepository,
        @Inject(AUTH_REPOSITORY)
        private readonly authRepository: IAuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(token: string, ip?: string, userAgent?: string): Promise<RefreshTokenResponse> {
        // Validar token JWT
        let payload: any;
        try {
            payload = this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Token inválido o expirado');
        }

        // Obtener sesión por token
        const sesion = await this.sesionRepository.obtenerSesionPorToken(token);

        if (!sesion || sesion.estado !== 1) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }

        // Obtener usuario por ID
        const usuario = await this.authRepository.login(payload.correo);

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Generar nuevo token
        const nuevoPayload = {
            sub: usuario.id,
            correo: usuario.correo,
            nombre: usuario.nombre,
            roles: usuario.roles,
            permisos: usuario.permisos,
        };

        const nuevoToken = this.jwtService.sign(nuevoPayload);

        // Actualizar sesión con nuevo token
        await this.sesionRepository.actualizarSesion(
            sesion.id!,
            nuevoToken,
            ip,
            userAgent,
            payload.sub,
        );

        return {
            token: nuevoToken,
            tipo_token: 'Bearer',
        };
    }
}
