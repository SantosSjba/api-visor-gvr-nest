import { Injectable } from '@nestjs/common';
import type {
    IRolRepository,
    ListarRolesParams,
    ListarRolesResponse,
    CrearRolData,
    EditarRolData,
    AsignarPermisoData,
    AsignarPermisosData,
    SincronizarPermisosData,
} from '../../domain/repositories/rol.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class RolRepository implements IRolRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarRoles(params: ListarRolesParams): Promise<ListarRolesResponse> {
        const { busqueda = '', limit = 10, offset = 0 } = params;

        const result = await this.databaseFunctionService.callFunction<any>(
            'authListarRoles',
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

    async listarRolesForList(): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'authListarRoles',
            [],
        );

        return result || [];
    }

    async obtenerRolPorId(idRol: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authObtenerRolPorId',
            [idRol],
        );

        return result;
    }

    async crearRol(data: CrearRolData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authCreateRol',
            [data.nombre, data.descripcion || '', data.idUsuarioCreacion],
        );

        return result;
    }

    async editarRol(data: EditarRolData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authUpdateRol',
            [data.idRol, data.nombre, data.descripcion || '', data.idUsuarioModificacion],
        );

        return result;
    }

    async eliminarRol(idRol: number, idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authDeleteRol',
            [idRol, idUsuarioModificacion],
        );

        return result;
    }

    async listarPermisosRol(idRol: number): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'authListarPermisosRol',
            [idRol],
        );

        return result || [];
    }

    async listarPermisosDisponibles(idRol: number): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'authListarPermisosDisponibles',
            [idRol],
        );

        return result || [];
    }

    async asignarPermisoRol(data: AsignarPermisoData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authAsignarPermisoRol',
            [data.idRol, data.idPermiso, data.idUsuarioCreacion],
        );

        return result;
    }

    async asignarPermisosRol(data: AsignarPermisosData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authAsignarPermisosRol',
            [data.idRol, JSON.stringify(data.permisos), data.idUsuarioCreacion],
        );

        return result;
    }

    async removerPermisoRol(idRol: number, idPermiso: number, idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authRemoverPermisoRol',
            [idRol, idPermiso, idUsuarioModificacion],
        );

        return result;
    }

    async sincronizarPermisosRol(data: SincronizarPermisosData): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authSincronizarPermisosRol',
            [data.idRol, JSON.stringify(data.permisos), data.idUsuarioModificacion],
        );

        return result;
    }

    async obtenerDetalleRol(idRol: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authObtenerDetalleRol',
            [idRol],
        );

        return result;
    }

    async gestionarRolesUsuario(idUsuario: number, rolesIds: number[], idUsuarioModificacion: number): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'authGestionarRolesUsuario',
            [idUsuario, JSON.stringify(rolesIds), idUsuarioModificacion],
        );

        return result;
    }
}
