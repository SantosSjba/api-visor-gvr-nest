import { Injectable } from '@nestjs/common';
import { IAuditoriaRepository } from '../../domain/repositories/auditoria.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class AuditoriaRepository implements IAuditoriaRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarAuditorias(
        idUsuario: number | null,
        accion: string | null,
        entidad: string | null,
        fechaDesde: string | null,
        fechaHasta: string | null,
        limit: number,
        offset: number,
    ): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'audListarAuditorias',
            [idUsuario, accion, entidad, fechaDesde, fechaHasta, limit, offset],
        );

        return result || [];
    }

    async obtenerAuditoriaPorId(id: number): Promise<any | null> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'audObtenerAuditoriaPorId',
            [id],
        );

        return result || null;
    }

    async obtenerHistorialEntidad(entidad: string, identidad: string): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'audObtenerHistorialEntidad',
            [entidad, identidad],
        );

        return result || [];
    }

    async obtenerHistorialUsuario(idUsuario: number, limit: number, offset: number): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'audObtenerHistorialUsuario',
            [idUsuario, limit, offset],
        );

        return result || [];
    }

    async obtenerEstadisticas(fechaDesde: string | null, fechaHasta: string | null): Promise<any | null> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'audObtenerEstadisticas',
            [fechaDesde, fechaHasta],
        );

        return result || null;
    }

    async registrarAccion(
        idUsuario: number,
        accion: string,
        entidad: string,
        identidad: string | null,
        descripcion: string | null,
        datosAnteriores: any | null,
        datosNuevos: any | null,
        ipAddress: string,
        userAgent: string,
        metadatos: any,
    ): Promise<any> {
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'audRegistrarAccion',
            [
                idUsuario,
                accion,
                entidad,
                identidad,
                descripcion,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos ? JSON.stringify(datosNuevos) : null,
                ipAddress,
                userAgent,
                JSON.stringify(metadatos),
            ],
        );

        return result || null;
    }
}

