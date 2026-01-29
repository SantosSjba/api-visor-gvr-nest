import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { LoginDto } from '../dtos/login.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface LoginResponse {
    access_token: string;
    user: {
        id: number;
        nombre: string;
        correo: string;
        estado: number;
        fotoPerfil?: string;
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
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async execute(loginDto: LoginDto, ip?: string, userAgent?: string): Promise<LoginResponse> {
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

        // Create session in database (like Laravel does)
        try {
            await this.dataSource.query(
                'SELECT * FROM authCrearActualizarSesion($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [
                    null,                                    // p_id (null for new session)
                    user.id,                                 // p_idUsuario
                    access_token,                            // p_token
                    ip || null,                              // p_ip
                    userAgent ? userAgent.substring(0, 500) : null, // p_userAgent (max 500 chars)
                    null,                                    // p_fechaFin
                    1,                                       // p_estado (1 = active)
                    user.id,                                 // p_idUsuarioCreacion
                    null,                                    // p_idUsuarioModificacion
                ],
            );
        } catch (error) {
            // Log error but don't fail login if session creation fails
            console.error('Error creating session:', error);
        }

        // Return user data without password
        return {
            access_token,
            user: {
                id: user.id,
                nombre: user.nombre,
                correo: user.correo,
                estado: user.estado,
                fotoPerfil: user.fotoPerfil,
                roles: user.roles,
                permisos: user.permisos,
                menus: user.menus,
            },
        };
    }
}
