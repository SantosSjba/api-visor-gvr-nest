import { AuthUser } from '../entities/auth-user.entity';

export interface RegisterUserData {
    nombre: string;
    correo: string;
    contrasena: string;
    estado?: number;
    id?: number | null;
}

export interface IAuthRepository {
    register(data: RegisterUserData): Promise<AuthUser>;
    login(correo: string): Promise<AuthUser | null>;
}

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';
