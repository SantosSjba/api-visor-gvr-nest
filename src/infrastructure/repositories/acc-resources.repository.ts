import { Injectable } from '@nestjs/common';
import type {
    IAccResourcesRepository,
    ListarRecursosParams,
    ListarRecursosResponse,
    CrearRecursoData,
    ActualizarRecursoData,
    ListarPermisosRolParams,
    AsignarPermisoData,
    SincronizarPermisosRolData,
} from '../../domain/repositories/acc-resources.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class AccResourcesRepository implements IAccResourcesRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarRecursos(params: ListarRecursosParams): Promise<ListarRecursosResponse> {
        const { busqueda = '', resourceType = '', limit = 10, offset = 0 } = params;

        const result = await this.databaseFunctionService.callFunction<any>(
            'accListarRecursos',
            [busqueda, resourceType, limit, offset],
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

    async obtenerRecursoPorId(id: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerRecursoPorId',
            [id],
        );

        return result;
    }

    async crearRecurso(data: CrearRecursoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accCreateRecurso',
            [
                data.external_id,
                data.resource_type,
                data.name,
                data.parent_id || null,
                data.account_id || null,
                data.idUsuarioCreacion,
            ],
        );

        return result;
    }

    async actualizarRecurso(id: number, data: ActualizarRecursoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accUpdateRecurso',
            [
                id,
                data.name,
                data.parent_id || null,
                data.account_id || null,
                data.idUsuarioModificacion,
            ],
        );

        return result;
    }

    async eliminarRecurso(id: number, idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accDeleteRecurso',
            [id, idUsuarioModificacion],
        );

        return result;
    }

    async listarPermisosRol(params: ListarPermisosRolParams): Promise<any> {
        const { roleId, limit = 100, offset = 0 } = params;

        const result = await this.databaseFunctionService.callFunction<any>(
            'accListarPermisosRol',
            [roleId, limit, offset],
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

    async listarRolesRecurso(resourceId: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'accListarRolesRecurso',
            [resourceId],
        );

        return {
            data: result || [],
        };
    }

    async asignarPermiso(data: AsignarPermisoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accAsignarPermiso',
            [
                data.role_id,
                data.resource_id,
                data.idUsuarioCreacion,
            ],
        );

        return result;
    }

    async removerPermiso(id: number, idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accRemoverPermiso',
            [id, idUsuarioModificacion],
        );

        return result;
    }

    async sincronizarPermisosRol(data: SincronizarPermisosRolData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accSincronizarPermisosRol',
            [
                data.role_id,
                data.resource_ids,
                data.idUsuarioModificacion,
            ],
        );

        return result;
    }
}

