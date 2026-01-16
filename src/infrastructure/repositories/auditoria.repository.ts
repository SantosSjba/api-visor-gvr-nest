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
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'audObtenerHistorialEntidad',
            [entidad, identidad],
        );

        // La función retorna un JSONB directamente, necesitamos extraerlo
        if (!result) {
            return [];
        }

        // Si el resultado es un objeto con una propiedad que contiene el JSONB
        const jsonbResult = result.audobtenerhistorialentidad || result.audObtenerHistorialEntidad || result;

        // Si es un string JSON, parsearlo
        if (typeof jsonbResult === 'string') {
            try {
                return JSON.parse(jsonbResult);
            } catch {
                return [];
            }
        }

        // Si ya es un array, retornarlo directamente
        if (Array.isArray(jsonbResult)) {
            return jsonbResult;
        }

        return [];
    }

    async obtenerAuditoriaPorMetadatos(
        entidad: string,
        accion: string,
        metadatoKey: string,
        metadatoValue: string,
    ): Promise<any | null> {
        // Buscar en auditoría usando metadatos JSONB
        // Incluir el rol del usuario desde la relación con authUsuariosRoles y authRoles
        // PostgreSQL convierte los nombres a minúsculas si no se usan comillas
        const query = `
            SELECT 
                a.id,
                a.idusuario,
                u.nombre as usuario,
                COALESCE(
                    (SELECT r.nombre 
                     FROM authusuariosroles ur
                     INNER JOIN authroles r ON ur.idrol = r.id
                     WHERE ur.idusuario = a.idusuario 
                       AND ur.estado = 1 
                       AND r.estado = 1
                     ORDER BY ur.fechacreacion DESC
                     LIMIT 1),
                    a.metadatos->>'rol',
                    'Sin rol'
                ) as rol,
                a.accion,
                a.descripcion,
                a.datosanteriores as datos_anteriores,
                a.datosnuevos as datos_nuevos,
                a.ipaddress as ip_address,
                a.useragent as user_agent,
                a.metadatos,
                a.fechacreacion
            FROM audauditoria a
            LEFT JOIN authusuarios u ON a.idusuario = u.id
            WHERE a.entidad = $1
                AND a.accion = $2
                AND a.estado = 1
                AND a.metadatos->>$3 = $4
            ORDER BY a.fechacreacion DESC
            LIMIT 1
        `;

        const result = await this.databaseFunctionService.executeQuery<any>(
            query,
            [entidad, accion, metadatoKey, metadatoValue],
        );

        return result.length > 0 ? result[0] : null;
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

    async obtenerAuditoriasPorItemId(itemId: string): Promise<any[]> {
        // Buscar todas las auditorías relacionadas con un archivo específico:
        // 1. Auditorías de archivo usando accItemId en metadatos
        // 2. Auditorías de incidencias vinculadas al archivo (usando documentUrn o itemId en metadatos)
        const query = `
            SELECT 
                a.id,
                a.idusuario,
                u.nombre as usuario,
                COALESCE(
                    (SELECT r.nombre 
                     FROM authusuariosroles ur
                     INNER JOIN authroles r ON ur.idrol = r.id
                     WHERE ur.idusuario = a.idusuario 
                       AND ur.estado = 1 
                       AND r.estado = 1
                     ORDER BY ur.fechacreacion DESC
                     LIMIT 1),
                    a.metadatos->>'rol',
                    'Sin rol'
                ) as rol,
                a.accion,
                a.descripcion,
                a.datosanteriores as datos_anteriores,
                a.datosnuevos as datos_nuevos,
                a.ipaddress as ip_address,
                a.useragent as user_agent,
                a.metadatos,
                a.fechacreacion,
                a.entidad
            FROM audauditoria a
            LEFT JOIN authusuarios u ON a.idusuario = u.id
            WHERE a.estado = 1
                AND (
                    -- Auditorías de archivo directamente (usando accItemId en metadatos)
                    (a.entidad = 'file' AND a.metadatos->>'accItemId' = $1)
                    OR
                    -- Auditorías de incidencias vinculadas al archivo
                    (a.entidad = 'issue' AND a.accion = 'ISSUE_CREATE' 
                     AND (
                         -- Buscar itemId en metadatos
                         a.metadatos->>'itemId' = $1
                         -- Buscar documentUrn en metadatos que contenga el itemId
                         OR (a.metadatos->>'documentUrn' IS NOT NULL AND a.metadatos->>'documentUrn' LIKE '%' || $1 || '%')
                         -- Buscar en datosNuevos (puede contener linkedDocuments con URN)
                         OR (a.datosnuevos IS NOT NULL AND a.datosnuevos::text LIKE '%' || $1 || '%')
                     ))
                )
            ORDER BY a.fechacreacion DESC
        `;

        const result = await this.databaseFunctionService.executeQuery<any>(
            query,
            [itemId],
        );

        return result || [];
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

        // La función retorna un JSONB, necesitamos extraerlo correctamente
        if (!result) {
            return null;
        }

        // Si el resultado es un objeto con una propiedad que contiene el JSONB
        const jsonbResult = result.audregistraraccion || result.audRegistrarAccion || result;

        // Si es un string JSON, parsearlo
        if (typeof jsonbResult === 'string') {
            try {
                return JSON.parse(jsonbResult);
            } catch {
                return jsonbResult;
            }
        }

        // Si ya es un objeto, retornarlo directamente
        return jsonbResult;
    }
}

