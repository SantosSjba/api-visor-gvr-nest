export interface ListarPermisosParams {
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface ListarPermisosResponse {
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
    };
}

export interface CrearPermisoData {
    nombre: string;
    descripcion?: string;
    idUsuarioCreacion: number;
}

export interface EditarPermisoData {
    idPermiso: number;
    nombre: string;
    descripcion?: string;
    idUsuarioModificacion: number;
}

export interface IPermisoRepository {
    listarPermisos(params: ListarPermisosParams): Promise<ListarPermisosResponse>;
    obtenerPermisoPorId(idPermiso: number): Promise<any>;
    crearPermiso(data: CrearPermisoData): Promise<any>;
    editarPermiso(data: EditarPermisoData): Promise<any>;
    eliminarPermiso(idPermiso: number, idUsuarioModificacion: number): Promise<any>;
}

export const PERMISO_REPOSITORY = 'PERMISO_REPOSITORY';
