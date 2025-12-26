export interface ListarProyectosParams {
    idUsuario: number;
    idTipoProyecto?: number;
    idPais?: number;
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface ListarProyectosResponse {
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
    };
}

export interface CrearProyectoData {
    nombreProyecto: string;
    nroProyecto: string;
    idTipoProyecto: number;
    idPais: number;
    direccion1?: string;
    direccion2?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    idZonaHoraria?: number;
    fechaInicio?: string;
    fechaFinalizacion?: string;
    valorProyecto?: number;
    idTipoMoneda?: number;
    idUsuarioCreacion: number;
}

export interface EditarProyectoData extends CrearProyectoData {
    idProyecto: number;
    idUsuarioModificacion: number;
}

export interface IProyectoRepository {
    listarProyectos(params: ListarProyectosParams): Promise<ListarProyectosResponse>;
    obtenerProyectoPorId(idProyecto: number): Promise<any>;
    crearProyecto(data: CrearProyectoData): Promise<any>;
    editarProyecto(data: EditarProyectoData): Promise<any>;
    eliminarProyecto(idProyecto: number, idUsuarioModificacion: number): Promise<any>;
}

export const PROYECTO_REPOSITORY = 'PROYECTO_REPOSITORY';
