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
        idUsuarioCreador: number,
        idUsuarioAsignado: number | null,
        nombre: string | null,
        descripcion: string | null,
        estado: string | null,
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
                estado,
                JSON.stringify(metadatos),
                idUsuarioCreacion,
            ],
        );

        return result || null;
    }

    async obtenerRecurso(recursoTipo: string, recursoId: string): Promise<any | null> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerRecurso',
            [recursoTipo, recursoId],
        );

        return result || null;
    }

    async actualizarRecurso(
        recursoTipo: string,
        recursoId: string,
        idUsuarioAsignado: number | null,
        idUsuarioModifico: number | null,
        estado: string | null,
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
                estado,
                metadatos ? JSON.stringify(metadatos) : null,
                idUsuarioModificacion,
            ],
        );

        return result || null;
    }

    async obtenerRecursosUsuario(
        idUsuario: number,
        recursoTipo: string | null,
        rol: string,
        limit: number,
        offset: number,
    ): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'accObtenerRecursosUsuario',
            [idUsuario, recursoTipo, rol, limit, offset],
        );

        return result || [];
    }

    async obtenerRecursosPorProyecto(
        projectId: string,
        recursoTipo: string | null,
        limit: number,
        offset: number,
    ): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'accObtenerRecursosPorProyecto',
            [projectId, recursoTipo, limit, offset],
        );

        return result || [];
    }

    async obtenerRecursosHijos(parentId: string, recursoTipo: string | null): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'accObtenerRecursosHijos',
            [parentId, recursoTipo],
        );

        return result || [];
    }
}

