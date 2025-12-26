import { Injectable } from '@nestjs/common';
import type {
    ITrabajadorRepository,
    ListarTrabajadoresParams,
    ListarTrabajadoresResponse,
    CrearTrabajadorData,
    EditarTrabajadorData,
} from '../../domain/repositories/trabajador.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class TrabajadorRepository implements ITrabajadorRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarTrabajadores(params: ListarTrabajadoresParams): Promise<ListarTrabajadoresResponse> {
        const { idUsuario, idEmpresa = null, busqueda = '', limit = 10, offset = 0 } = params;

        // Call traListarTrabajadores function
        // SELECT * FROM traListarTrabajadores(p_idUsuario, p_idEmpresa, p_busqueda, p_limit, p_offset)
        const result = await this.databaseFunctionService.callFunction<any>(
            'traListarTrabajadores',
            [idUsuario, idEmpresa, busqueda, limit, offset],
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

    async listarTrabajadoresAdministrativos(): Promise<any[]> {
        // Call traListarTrabajadoresAdministrativos function
        // SELECT * FROM traListarTrabajadoresAdministrativos()
        const result = await this.databaseFunctionService.callFunction<any>(
            'traListarTrabajadoresAdministrativos',
            [],
        );

        if (!result || result.length === 0) {
            return [];
        }

        // Decode JSON fields
        return result.map(admin => {
            if (admin.roles && typeof admin.roles === 'string') {
                try {
                    admin.roles = JSON.parse(admin.roles);
                } catch (e) {
                    admin.roles = [];
                }
            }
            if (admin.permisos && typeof admin.permisos === 'string') {
                try {
                    admin.permisos = JSON.parse(admin.permisos);
                } catch (e) {
                    admin.permisos = [];
                }
            }
            return admin;
        });
    }

    async obtenerTrabajadorPorId(idTrabajador: number): Promise<any> {
        // Call traObtenerTrabajadorPorId function
        // SELECT * FROM traObtenerTrabajadorPorId(p_idTrabajador)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'traObtenerTrabajadorPorId',
            [idTrabajador],
        );

        if (!result) {
            return null;
        }

        // Decode roles if it's a JSON string
        if (result.roles && typeof result.roles === 'string') {
            try {
                result.roles = JSON.parse(result.roles);
            } catch (e) {
                result.roles = [];
            }
        }

        return result;
    }

    async crearTrabajador(data: CrearTrabajadorData): Promise<any> {
        // Call traCrearTrabajador function
        // SELECT * FROM traCrearTrabajador(p_nombres, p_apellidos, p_idTipoDocumento, p_nroDocumento, p_correo, p_idEmpresa, p_idResponsable, p_idRol, p_idUsuarioCreacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'traCrearTrabajador',
            [
                data.nombres,
                data.apellidos,
                data.idTipoDocumento,
                data.nroDocumento,
                data.correo,
                data.idEmpresa,
                data.idResponsable || null,
                data.idRol || null,
                data.idUsuarioCreacion,
            ],
        );

        return result;
    }

    async editarTrabajador(data: EditarTrabajadorData): Promise<any> {
        // Call traEditarTrabajador function
        // SELECT * FROM traEditarTrabajador(p_idTrabajador, p_nombres, p_apellidos, p_idTipoDocumento, p_nroDocumento, p_correo, p_idEmpresa, p_idResponsable, p_idUsuarioModificacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'traEditarTrabajador',
            [
                data.idTrabajador,
                data.nombres,
                data.apellidos,
                data.idTipoDocumento,
                data.nroDocumento,
                data.correo,
                data.idEmpresa,
                data.idResponsable || null,
                data.idUsuarioModificacion,
            ],
        );

        return result;
    }

    async eliminarTrabajador(idTrabajador: number, idUsuarioModificacion: number): Promise<any> {
        // Call traEliminarTrabajador function
        // SELECT * FROM traEliminarTrabajador(p_idTrabajador, p_idUsuarioModificacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'traEliminarTrabajador',
            [idTrabajador, idUsuarioModificacion],
        );

        return result;
    }

    async resetearContrasena(idTrabajador: number, idUsuarioModificacion: number): Promise<any> {
        // Call traResetearContrasena function
        // SELECT * FROM traResetearContrasena(p_idTrabajador, p_idUsuarioModificacion)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'traResetearContrasena',
            [idTrabajador, idUsuarioModificacion],
        );

        return result;
    }
}
