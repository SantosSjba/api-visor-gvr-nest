import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { LoginDto } from '../dtos/login.dto';

export interface LoginResponse {
    access_token: string;
    user: {
        id: number;
        nombre: string;
        correo: string;
        estado: number;
        roles: any[];
        permisos: any[];
        menus: any[];
    };
}

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(AUTH_REPOSITORY)
        private readonly authRepository: IAuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(loginDto: LoginDto): Promise<LoginResponse> {
        // Get user from database
        const user = await this.authRepository.login(loginDto.correo);

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Fix: PHP bcrypt uses $2y$, Node.js bcrypt uses $2a$ or $2b$
        // They are functionally identical, so we can safely convert
        let passwordHash = user.contrasena;
        if (passwordHash.startsWith('$2y$')) {
            passwordHash = passwordHash.replace(/^\$2y\$/, '$2a$');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            loginDto.contrasena,
            passwordHash,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Generate JWT token
        const payload = {
            sub: user.id,
            correo: user.correo,
            nombre: user.nombre,
            roles: user.roles,
            permisos: user.permisos,
        };

        const access_token = await this.jwtService.signAsync(payload);

        // Return user data without password
        return {
            access_token,
            user: {
                id: user.id,
                nombre: user.nombre,
                correo: user.correo,
                estado: user.estado,
                roles: user.roles,
                permisos: user.permisos,
                menus: user.menus,
            },
        };
    }
}
