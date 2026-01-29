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
            fotoPerfil: result.fotoperfil ?? result.fotoPerfil ?? undefined,
            roles: result.roles || [],
            permisos: result.permisos || [],
            menus: result.menus || [],
        });
    }

    async obtenerPerfilUsuario(idUsuario: number): Promise<any> {
        // Call authobtenerperfilusuario function
        // SELECT * FROM authobtenerperfilusuario(p_id_usuario)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authobtenerperfilusuario',
            [idUsuario],
        );

        if (!result) {
            return null;
        }

        // Decodificar campos JSON si son strings
        const perfil = { ...result };

        // Decodificar trabajador (JSON string a objeto/array)
        if (perfil.trabajador && typeof perfil.trabajador === 'string') {
            try {
                perfil.trabajador = JSON.parse(perfil.trabajador);
            } catch (e) {
                // Si falla el parse, dejar como está
            }
        }

        // Decodificar roles (JSON string a array)
        if (perfil.roles && typeof perfil.roles === 'string') {
            try {
                perfil.roles = JSON.parse(perfil.roles);
            } catch (e) {
                perfil.roles = [];
            }
        }

        // Decodificar sesionactiva (JSON string a objeto/array)
        if (perfil.sesionactiva && typeof perfil.sesionactiva === 'string') {
            try {
                perfil.sesionactiva = JSON.parse(perfil.sesionactiva);
            } catch (e) {
                // Si falla el parse, dejar como está
            }
        }

        return perfil;
    }

    async actualizarCredenciales(
        idUsuario: number,
        nuevoCorreo: string | null,
        nuevaContrasena: string | null,
        idUsuarioModificacion: number,
    ): Promise<any> {
        // Call authActualizarCredencialesUsuario function
        // SELECT * FROM authActualizarCredencialesUsuario(p_idUsuario, p_nuevoCorreo, p_nuevaContrasena, p_idUsuarioModificacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authActualizarCredencialesUsuario',
            [
                idUsuario,
                nuevoCorreo,
                nuevaContrasena,
                idUsuarioModificacion,
            ],
        );

        if (!result) {
            throw new Error('No se pudieron actualizar las credenciales');
        }

        return result;
    }

    async actualizarFotoPerfil(idUsuario: number, fotoPerfil: string): Promise<{ fotoPerfil: string }> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authActualizarFotoPerfilUsuario',
            [idUsuario, fotoPerfil],
        );

        if (!result) {
            throw new Error('No se pudo actualizar la foto de perfil');
        }

        const path = result.fotoperfil ?? result.fotoPerfil ?? fotoPerfil;
        return { fotoPerfil: path };
    }
}
