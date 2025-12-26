import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { AUTH_REPOSITORY } from '../../../domain/repositories/auth.repository.interface';

@Injectable()
export class ObtenerPerfilUsuarioUseCase {
    constructor(
        @Inject(AUTH_REPOSITORY)
        private readonly authRepository: IAuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(token: string): Promise<any> {
        // Validate and decode token
        const payload = await this.jwtService.verifyAsync(token);

        if (!payload || !payload.sub) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Get user profile from repository
        const perfil = await this.authRepository.obtenerPerfilUsuario(payload.sub);

        if (!perfil) {
            throw new NotFoundException('Perfil no encontrado');
        }

        return perfil;
    }
}
