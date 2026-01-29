export interface Role {
    id: number;
    nombre: string;
    descripcion: string;
}

export interface Permission {
    id: number;
    nombre: string;
    descripcion: string;
}

export interface Menu {
    id: number;
    idPadre: number | null;
    nombre: string;
    url: string;
    icono: string;
    orden: number;
    nivel: number;
}

export class AuthUser {
    id: number;
    nombre: string;
    correo: string;
    contrasena: string;
    estado: number;
    fechacreacion: Date;
    fechamodificacion: Date;
    fotoPerfil?: string;
    roles: Role[];
    permisos: Permission[];
    menus: Menu[];

    constructor(partial: Partial<AuthUser>) {
        Object.assign(this, partial);
    }
}
