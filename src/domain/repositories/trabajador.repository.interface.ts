export interface ListarTrabajadoresParams {
    idUsuario: number;
    idEmpresa?: number;
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface ListarTrabajadoresResponse {
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
    };
}

export interface CrearTrabajadorData {
    nombres: string;
    apellidos: string;
    idTipoDocumento: number;
    nroDocumento: string;
    correo: string;
    idEmpresa: number;
    idResponsable?: number;
    idRol?: number;
    idUsuarioCreacion: number;
}

export interface EditarTrabajadorData {
    idTrabajador: number;
    nombres: string;
    apellidos: string;
    idTipoDocumento: number;
    nroDocumento: string;
    correo: string;
    idEmpresa: number;
    idResponsable?: number;
    idUsuarioModificacion: number;
}

export interface ITrabajadorRepository {
    listarTrabajadores(params: ListarTrabajadoresParams): Promise<ListarTrabajadoresResponse>;
    listarTrabajadoresAdministrativos(): Promise<any[]>;
    obtenerTrabajadorPorId(idTrabajador: number): Promise<any>;
    crearTrabajador(data: CrearTrabajadorData): Promise<any>;
    editarTrabajador(data: EditarTrabajadorData): Promise<any>;
    eliminarTrabajador(idTrabajador: number, idUsuarioModificacion: number): Promise<any>;
    resetearContrasena(idTrabajador: number, idUsuarioModificacion: number): Promise<any>;
}

export const TRABAJADOR_REPOSITORY = 'TRABAJADOR_REPOSITORY';
