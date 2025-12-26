import { Injectable } from '@nestjs/common';
import type {
    IPermisoRepository,
    ListarPermisosParams,
    ListarPermisosResponse,
    CrearPermisoData,
    EditarPermisoData,
} from '../../domain/repositories/permiso.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class PermisoRepository implements IPermisoRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarPermisos(params: ListarPermisosParams): Promise<ListarPermisosResponse> {
        const { busqueda = '', limit = 10, offset = 0 } = params;

        const result = await this.databaseFunctionService.callFunction<any>(
            'authListarPermisos',
            [busqueda, limit, offset],
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

    async obtenerPermisoPorId(idPermiso: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authObtenerPermisoPorId',
            [idPermiso],
        );

        return result;
    }

    async crearPermiso(data: CrearPermisoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authCreatePermiso',
            [data.nombre, data.descripcion || '', data.idUsuarioCreacion],
        );

        return result;
    }

    async editarPermiso(data: EditarPermisoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authUpdatePermiso',
            [data.idPermiso, data.nombre, data.descripcion || '', data.idUsuarioModificacion],
        );

        return result;
    }

    async eliminarPermiso(idPermiso: number, idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authDeletePermiso',
            [idPermiso, idUsuarioModificacion],
        );

        return result;
    }
}
