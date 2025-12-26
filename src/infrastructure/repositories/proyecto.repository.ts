import { Injectable } from '@nestjs/common';
import type {
    IProyectoRepository,
    ListarProyectosParams,
    ListarProyectosResponse,
    CrearProyectoData,
    EditarProyectoData,
} from '../../domain/repositories/proyecto.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class ProyectoRepository implements IProyectoRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarProyectos(params: ListarProyectosParams): Promise<ListarProyectosResponse> {
        const { idUsuario, idTipoProyecto = null, idPais = null, busqueda = '', limit = 10, offset = 0 } = params;

        const result = await this.databaseFunctionService.callFunction<any>(
            'proListarProyectos',
            [idUsuario, idTipoProyecto, idPais, busqueda, limit, offset],
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

    async obtenerProyectoPorId(idProyecto: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'proObtenerProyectoPorId',
            [idProyecto],
        );

        return result;
    }

    async crearProyecto(data: CrearProyectoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'proCrearProyecto',
            [
                data.nombreProyecto,
                data.nroProyecto,
                data.idTipoProyecto,
                data.idPais,
                data.direccion1 || null,
                data.direccion2 || null,
                data.ciudad || null,
                data.provincia || null,
                data.codigoPostal || null,
                data.idZonaHoraria || null,
                data.fechaInicio || null,
                data.fechaFinalizacion || null,
                data.valorProyecto || null,
                data.idTipoMoneda || null,
                data.idUsuarioCreacion,
            ],
        );

        return result;
    }

    async editarProyecto(data: EditarProyectoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'proEditarProyecto',
            [
                data.idProyecto,
                data.nombreProyecto,
                data.nroProyecto,
                data.idTipoProyecto,
                data.idPais,
                data.direccion1 || null,
                data.direccion2 || null,
                data.ciudad || null,
                data.provincia || null,
                data.codigoPostal || null,
                data.idZonaHoraria || null,
                data.fechaInicio || null,
                data.fechaFinalizacion || null,
                data.valorProyecto || null,
                data.idTipoMoneda || null,
                data.idUsuarioModificacion,
            ],
        );

        return result;
    }

    async eliminarProyecto(idProyecto: number, idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'proEliminarProyecto',
            [idProyecto, idUsuarioModificacion],
        );

        return result;
    }
}
