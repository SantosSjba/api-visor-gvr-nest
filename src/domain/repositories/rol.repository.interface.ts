export interface ListarRolesParams {
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface ListarRolesResponse {
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
    };
}

export interface CrearRolData {
    nombre: string;
    descripcion?: string;
    idUsuarioCreacion: number;
}

export interface EditarRolData {
    idRol: number;
    nombre: string;
    descripcion?: string;
    idUsuarioModificacion: number;
}

export interface AsignarPermisoData {
    idRol: number;
    idPermiso: number;
    idUsuarioCreacion: number;
}

export interface AsignarPermisosData {
    idRol: number;
    permisos: number[];
    idUsuarioCreacion: number;
}

export interface SincronizarPermisosData {
    idRol: number;
    permisos: number[];
    idUsuarioModificacion: number;
}

export interface IRolRepository {
    listarRoles(params: ListarRolesParams): Promise<ListarRolesResponse>;
    listarRolesForList(): Promise<any[]>;
    obtenerRolPorId(idRol: number): Promise<any>;
    crearRol(data: CrearRolData): Promise<any>;
    editarRol(data: EditarRolData): Promise<any>;
    eliminarRol(idRol: number, idUsuarioModificacion: number): Promise<any>;
    listarPermisosRol(idRol: number): Promise<any[]>;
    listarPermisosDisponibles(idRol: number): Promise<any[]>;
    asignarPermisoRol(data: AsignarPermisoData): Promise<any>;
    asignarPermisosRol(data: AsignarPermisosData): Promise<any>;
    removerPermisoRol(idRol: number, idPermiso: number, idUsuarioModificacion: number): Promise<any>;
    sincronizarPermisosRol(data: SincronizarPermisosData): Promise<any>;
    obtenerDetalleRol(idRol: number): Promise<any>;
    gestionarRolesUsuario(idUsuario: number, rolesIds: number[], idUsuarioModificacion: number): Promise<any>;
}

export const ROL_REPOSITORY = 'ROL_REPOSITORY';
