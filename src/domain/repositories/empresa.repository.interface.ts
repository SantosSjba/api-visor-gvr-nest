export interface ListarEmpresasParams {
    idUsuario: number;
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface ListarEmpresasResponse {
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
    };
}

export interface CrearEmpresaData {
    razonSocial: string;
    nombreComercial?: string;
    idTipoDocumento: number;
    nroDocumento: string;
    idUsuarioCreacion: number;
}

export interface EditarEmpresaData {
    idEmpresa: number;
    razonSocial: string;
    nombreComercial?: string;
    idTipoDocumento: number;
    nroDocumento: string;
    idUsuarioModificacion: number;
}

export interface IEmpresaRepository {
    listarEmpresas(params: ListarEmpresasParams): Promise<ListarEmpresasResponse>;
    obtenerEmpresaPorId(idEmpresa: number): Promise<any>;
    crearEmpresa(data: CrearEmpresaData): Promise<any>;
    editarEmpresa(data: EditarEmpresaData): Promise<any>;
    eliminarEmpresa(idEmpresa: number, idUsuarioModificacion: number): Promise<any>;
}

export const EMPRESA_REPOSITORY = 'EMPRESA_REPOSITORY';
