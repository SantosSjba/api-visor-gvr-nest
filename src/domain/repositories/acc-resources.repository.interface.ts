export interface ListarRecursosParams {
    busqueda?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
}

export interface ListarRecursosResponse {
    data: any[];
    pagination?: {
        total: number;
        limit: number;
        offset: number;
        total_pages?: number;
        current_page?: number;
    };
}

export interface CrearRecursoData {
    external_id: string;
    resource_type: string;
    name: string;
    parent_id?: number;
    account_id?: string;
    idUsuarioCreacion: number;
}

export interface ActualizarRecursoData {
    name: string;
    parent_id?: number;
    account_id?: string;
    idUsuarioModificacion: number;
}

export interface ListarPermisosRolParams {
    roleId: number;
    limit?: number;
    offset?: number;
}

export interface AsignarPermisoData {
    role_id: number;
    resource_id: number;
    idUsuarioCreacion: number;
}

export interface SincronizarPermisosRolData {
    role_id: number;
    resource_ids: number[];
    idUsuarioModificacion: number;
}

export interface ListarPermisosUsuarioParams {
    userId: number;
    limit?: number;
    offset?: number;
}

export interface AsignarPermisoUsuarioData {
    user_id: number;
    resource_id: number;
    idUsuarioCreacion: number;
}

export interface SincronizarPermisosUsuarioData {
    user_id: number;
    resource_ids: number[];
    idUsuarioModificacion: number;
}

export interface ListarUsuariosDisponiblesRecursoParams {
    resourceId: number;
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface SincronizarPermisosProyectoData {
    project_resource_id: number;
    idUsuarioModificacion: number;
    roles_ids?: number[]; // IDs de roles para filtrar (opcional)
}

export interface IAccResourcesRepository {
    listarRecursos(params: ListarRecursosParams): Promise<ListarRecursosResponse>;
    obtenerRecursoPorId(id: number): Promise<any>;
    obtenerRecursoPorExternalId(externalId: string): Promise<any>;
    crearRecurso(data: CrearRecursoData): Promise<any>;
    actualizarRecurso(id: number, data: ActualizarRecursoData): Promise<any>;
    eliminarRecurso(id: number, idUsuarioModificacion: number): Promise<any>;
    listarPermisosRol(params: ListarPermisosRolParams): Promise<any>;
    listarRolesRecurso(resourceId: number): Promise<any>;
    asignarPermiso(data: AsignarPermisoData): Promise<any>;
    removerPermiso(id: number, idUsuarioModificacion: number): Promise<any>;
    sincronizarPermisosRol(data: SincronizarPermisosRolData): Promise<any>;
    // Métodos para permisos de usuarios
    listarPermisosUsuario(params: ListarPermisosUsuarioParams): Promise<any>;
    listarUsuariosRecurso(resourceId: number): Promise<any>;
    listarUsuariosDisponiblesRecurso(params: ListarUsuariosDisponiblesRecursoParams): Promise<any>;
    asignarPermisoUsuario(data: AsignarPermisoUsuarioData): Promise<any>;
    removerPermisoUsuario(id: number, idUsuarioModificacion: number): Promise<any>;
    sincronizarPermisosUsuario(data: SincronizarPermisosUsuarioData): Promise<any>;
    sincronizarPermisosProyecto(data: SincronizarPermisosProyectoData): Promise<any>;
}

export const ACC_RESOURCES_REPOSITORY = 'ACC_RESOURCES_REPOSITORY';

