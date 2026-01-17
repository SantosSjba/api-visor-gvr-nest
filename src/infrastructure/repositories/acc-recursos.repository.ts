import { Injectable } from '@nestjs/common';
import { IAccRecursosRepository } from '../../domain/repositories/acc-recursos.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class AccRecursosRepository implements IAccRecursosRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async guardarRecurso(
        recursoTipo: string,
        recursoId: string,
        recursoUrn: string | null,
        projectId: string | null,
        parentId: string | null,
        idUsuarioCreador: number | null,
        idUsuarioAsignado: number | null,
        nombre: string | null,
        descripcion: string | null,
        estadoRecurso: string | null,
        metadatos: any,
        idUsuarioCreacion: number,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accGuardarRecurso',
            [
                recursoTipo,
                recursoId,
                recursoUrn,
                projectId,
                parentId,
                idUsuarioCreador,
                idUsuarioAsignado,
                nombre,
                descripcion,
                estadoRecurso,
                metadatos,
                idUsuarioCreacion,
            ],
        );

        if (!result) {
            return null;
        }

        // La función retorna una tabla con success, message, id
        // Extraer el primer resultado
        const jsonbResult = result.accguardarrecurso || result.accGuardarRecurso || result;

        return jsonbResult;
    }

    async obtenerRecurso(recursoTipo: string, recursoId: string): Promise<any | null> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerRecurso',
            [recursoTipo, recursoId],
        );

        if (!result) {
            return null;
        }

        // La función retorna un JSONB directamente, necesitamos extraerlo
        const jsonbResult = result.accobtenerrecurso || result.accObtenerRecurso || result;

        // Si el resultado tiene success: false, retornar null
        if (jsonbResult && jsonbResult.success === false) {
            return null;
        }

        return jsonbResult;
    }

    async actualizarRecurso(
        recursoTipo: string,
        recursoId: string,
        idUsuarioAsignado: number | null,
        idUsuarioModifico: number | null,
        estadoRecurso: string | null,
        metadatos: any | null,
        idUsuarioModificacion: number,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accActualizarRecurso',
            [
                recursoTipo,
                recursoId,
                idUsuarioAsignado,
                idUsuarioModifico,
                estadoRecurso,
                metadatos,
                idUsuarioModificacion,
                true, // p_actualizar_asignado: siempre actualizar el campo de asignación (incluso si es NULL para desasignar)
            ],
        );

        if (!result) {
            return null;
        }

        // La función retorna una tabla con success, message
        const jsonbResult = result.accactualizarrecurso || result.accActualizarRecurso || result;

        return jsonbResult;
    }

    async obtenerRecursosPorProyecto(
        projectId: string,
        recursoTipo: string | null,
        limit: number,
        offset: number,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerRecursosPorProyecto',
            [projectId, recursoTipo, limit, offset],
        );

        if (!result) {
            return { data: [], total_registros: 0 };
        }

        // La función retorna un JSONB directamente
        const jsonbResult = result.accobtenerrecursosporproyecto || result.accObtenerRecursosPorProyecto || result;

        return jsonbResult || { data: [], total_registros: 0 };
    }

    async obtenerRecursosHijos(
        parentId: string,
        recursoTipo: string | null,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerRecursosHijos',
            [parentId, recursoTipo],
        );

        if (!result) {
            return [];
        }

        // La función retorna un JSONB directamente
        const jsonbResult = result.accobtenerrecursoshijos || result.accObtenerRecursosHijos || result;

        // Si es un array, retornarlo directamente
        if (Array.isArray(jsonbResult)) {
            return jsonbResult;
        }

        // Si tiene una propiedad data, retornarla
        if (jsonbResult && jsonbResult.data) {
            return jsonbResult.data;
        }

        return [];
    }

    async obtenerRecursosUsuario(
        idUsuario: number,
        recursoTipo: string | null,
        rol: string,
        limit: number,
        offset: number,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerRecursosUsuario',
            [idUsuario, recursoTipo, rol, limit, offset],
        );

        if (!result) {
            return { data: [], total_registros: 0 };
        }

        // La función retorna un JSONB directamente
        const jsonbResult = result.accobtenerrecursosusuario || result.accObtenerRecursosUsuario || result;

        // Si tiene estructura con data y total_registros, retornarla
        if (jsonbResult && jsonbResult.data !== undefined) {
            return jsonbResult;
        }

        // Si es un array, convertirlo a formato esperado
        if (Array.isArray(jsonbResult)) {
            return {
                data: jsonbResult,
                total_registros: jsonbResult.length,
            };
        }

        return { data: [], total_registros: 0 };
    }

    async asignarUsuariosIncidencia(
        issueId: string,
        projectId: string,
        userIds: number[],
        idUsuarioAsignador: number,
        idUsuarioCreacion: number,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accAsignarUsuariosIncidencia',
            [issueId, projectId, userIds, idUsuarioAsignador, idUsuarioCreacion],
        );

        if (!result) {
            return null;
        }

        const jsonbResult = result.accasignarusuariosincidencia || result.accAsignarUsuariosIncidencia || result;

        return jsonbResult;
    }

    async desasignarUsuariosIncidencia(
        issueId: string,
        userIds: number[] | null,
        idUsuarioModificacion: number,
    ): Promise<any> {
        // Asegurar que si es un array vacío, se pase como null explícitamente
        // PostgreSQL necesita null para desasignar todos, no un array vacío
        const userIdsParam = (userIds && Array.isArray(userIds) && userIds.length > 0) ? userIds : null;
        
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accDesasignarUsuariosIncidencia',
            [issueId, idUsuarioModificacion, userIdsParam],
        );

        if (!result) {
            return {
                success: false,
                message: 'No se obtuvo respuesta de la función de desasignación',
            };
        }

        const jsonbResult = result.accdesasignarusuariosincidencia || result.accDesasignarUsuariosIncidencia || result;

        return jsonbResult;
    }

    async obtenerUsuariosAsignadosIncidencia(issueId: string): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerUsuariosAsignadosIncidencia',
            [issueId],
        );

        if (!result) {
            return { success: false, data: [], total: 0 };
        }

        const jsonbResult = result.accobtenerusuariosasignadosincidencia || result.accObtenerUsuariosAsignadosIncidencia || result;

        return jsonbResult;
    }
}
