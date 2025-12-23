import { Injectable } from '@nestjs/common';
import { IAuthRepository, RegisterUserData } from '../../domain/repositories/auth.repository.interface';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class AuthRepository implements IAuthRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async register(data: RegisterUserData): Promise<AuthUser> {
        // Call authCrearUsuario function
        // SELECT * FROM authCrearUsuario(p_id, p_nombre, p_correo, p_contrasena, p_estado)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authCrearUsuario',
            [
                data.id ?? null,        // p_id
                data.nombre,            // p_nombre
                data.correo,            // p_correo
                data.contrasena,        // p_contrasena
                data.estado ?? 1,       // p_estado
            ],
        );

        if (!result) {
            throw new Error('Error al crear usuario');
        }

        return new AuthUser({
            id: result.id,
            nombre: result.nombre,
            correo: result.correo,
            contrasena: result.contrasena,
            estado: result.estado,
            fechacreacion: result.fechacreacion || result.fechaCreacion,
            fechamodificacion: result.fechamodificacion || result.fechaModificacion,
            roles: [],
            permisos: [],
            menus: [],
        });
    }

    async login(correo: string): Promise<AuthUser | null> {
        // Call authLoginUsuarioV2 function
        // SELECT * FROM authLoginUsuarioV2(correo)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authLoginUsuarioV2',
            [correo],
        );

        if (!result) {
            return null;
        }

        return new AuthUser({
            id: result.id,
            nombre: result.nombre,
            correo: result.correo,
            contrasena: result.contrasena,
            estado: result.estado,
            fechacreacion: result.fechacreacion || result.fechaCreacion,
            fechamodificacion: result.fechamodificacion || result.fechaModificacion,
            roles: result.roles || [],
            permisos: result.permisos || [],
            menus: result.menus || [],
        });
    }
}
