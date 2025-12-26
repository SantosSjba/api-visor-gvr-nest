import { Injectable } from '@nestjs/common';
import type {
    IEmpresaRepository,
    ListarEmpresasParams,
    ListarEmpresasResponse,
    CrearEmpresaData,
    EditarEmpresaData,
} from '../../domain/repositories/empresa.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class EmpresaRepository implements IEmpresaRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarEmpresas(params: ListarEmpresasParams): Promise<ListarEmpresasResponse> {
        const { idUsuario, busqueda = '', limit = 10, offset = 0 } = params;

        // Call emListarEmpresas function
        // SELECT * FROM emListarEmpresas(p_idUsuario, p_busqueda, p_limit, p_offset)
        const result = await this.databaseFunctionService.callFunction<any>(
            'emListarEmpresas',
            [idUsuario, busqueda, limit, offset],
        );

        if (!result || result.length === 0) {
            return {
                data: [],
                pagination: {
                    total: 0,
                    limit,
                    offset,
                    total_pages: 0,
                    current_page: 1,
                },
            };
        }

        // Extract total from first element
        const totalRegistros = result[0]?.total_registros || 0;

        return {
            data: result,
            pagination: {
                total: totalRegistros,
                limit,
                offset,
                total_pages: limit > 0 ? Math.ceil(totalRegistros / limit) : 0,
                current_page: limit > 0 ? Math.floor(offset / limit) + 1 : 1,
            },
        };
    }

    async obtenerEmpresaPorId(idEmpresa: number): Promise<any> {
        // Call emObtenerEmpresaPorId function
        // SELECT * FROM emObtenerEmpresaPorId(p_idEmpresa)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'emObtenerEmpresaPorId',
            [idEmpresa],
        );

        return result;
    }

    async crearEmpresa(data: CrearEmpresaData): Promise<any> {
        // Call emCrearEmpresa function
        // SELECT * FROM emCrearEmpresa(p_razonSocial, p_nombreComercial, p_idTipoDocumento, p_nroDocumento, p_idUsuarioCreacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'emCrearEmpresa',
            [
                data.razonSocial,
                data.nombreComercial || null,
                data.idTipoDocumento,
                data.nroDocumento,
                data.idUsuarioCreacion,
            ],
        );

        return result;
    }

    async editarEmpresa(data: EditarEmpresaData): Promise<any> {
        // Call emEditarEmpresa function
        // SELECT * FROM emEditarEmpresa(p_idEmpresa, p_razonSocial, p_nombreComercial, p_idTipoDocumento, p_nroDocumento, p_idUsuarioModificacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'emEditarEmpresa',
            [
                data.idEmpresa,
                data.razonSocial,
                data.nombreComercial || null,
                data.idTipoDocumento,
                data.nroDocumento,
                data.idUsuarioModificacion,
            ],
        );

        return result;
    }

    async eliminarEmpresa(idEmpresa: number, idUsuarioModificacion: number): Promise<any> {
        // Call emEliminarEmpresa function
        // SELECT * FROM emEliminarEmpresa(p_idEmpresa, p_idUsuarioModificacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'emEliminarEmpresa',
            [idEmpresa, idUsuarioModificacion],
        );

        return result;
    }
}
