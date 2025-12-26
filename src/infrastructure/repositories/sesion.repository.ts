import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ISesionRepository } from '../../domain/repositories/sesion.repository.interface';
import { Sesion } from '../../domain/entities/sesion.entity';

@Injectable()
export class SesionRepository implements ISesionRepository {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    async obtenerSesionPorToken(token: string): Promise<Sesion | null> {
        // Direct SQL query to authSesiones table
        // SELECT * FROM authSesiones WHERE token = ? AND estado = 1 LIMIT 1
        const result = await this.dataSource.query(
            'SELECT * FROM authSesiones WHERE token = $1 AND estado = 1 LIMIT 1',
            [token],
        );

        if (!result || result.length === 0) {
            return null;
        }

        const row = result[0];
        return new Sesion({
            id: row.id,
            idUsuario: row.idusuario,
            token: row.token,
            ip: row.ip,
            userAgent: row.useragent,
            fechaInicio: row.fechainicio ? new Date(row.fechainicio) : undefined,
            fechaFin: row.fechafin ? new Date(row.fechafin) : undefined,
            duracion: row.duracion,
            estado: row.estado,
            fechaCreacion: row.fechacreacion ? new Date(row.fechacreacion) : undefined,
            fechaModificacion: row.fechamodificacion ? new Date(row.fechamodificacion) : undefined,
        });
    }

    async actualizarSesion(
        id: number,
        token: string,
        ip?: string,
        userAgent?: string,
        idUsuarioModificacion?: number,
    ): Promise<Sesion> {
        // Direct SQL UPDATE with RETURNING
        // UPDATE authSesiones SET token = ?, ip = ?, userAgent = ?, fechaModificacion = CURRENT_TIMESTAMP, idUsuarioModificacion = ? WHERE id = ? RETURNING *
        const result = await this.dataSource.query(
            `UPDATE authSesiones 
             SET token = $1, ip = $2, useragent = $3, fechamodificacion = CURRENT_TIMESTAMP, idusuariomodificacion = $4
             WHERE id = $5 
             RETURNING *`,
            [token, ip || null, userAgent || null, idUsuarioModificacion || null, id],
        );

        if (!result || result.length === 0) {
            throw new Error('Error al actualizar sesión');
        }

        const row = result[0];
        return new Sesion({
            id: row.id,
            idUsuario: row.idusuario,
            token: row.token,
            ip: row.ip,
            userAgent: row.useragent,
            fechaInicio: row.fechainicio ? new Date(row.fechainicio) : undefined,
            fechaFin: row.fechafin ? new Date(row.fechafin) : undefined,
            duracion: row.duracion,
            estado: row.estado,
            fechaCreacion: row.fechacreacion ? new Date(row.fechacreacion) : undefined,
            fechaModificacion: row.fechamodificacion ? new Date(row.fechamodificacion) : undefined,
        });
    }

    async cerrarSesion(id: number, idUsuarioModificacion: number): Promise<void> {
        // Direct SQL UPDATE
        // UPDATE authSesiones SET estado = 0, fechaFin = CURRENT_TIMESTAMP, idUsuarioModificacion = ? WHERE id = ?
        await this.dataSource.query(
            `UPDATE authSesiones 
             SET estado = 0, fechafin = CURRENT_TIMESTAMP, idusuariomodificacion = $1
             WHERE id = $2`,
            [idUsuarioModificacion, id],
        );
    }

    async cerrarTodasLasSesiones(idUsuario: number, idUsuarioModificacion: number): Promise<void> {
        // Direct SQL UPDATE
        // UPDATE authSesiones SET estado = 0, fechaFin = CURRENT_TIMESTAMP, idUsuarioModificacion = ? WHERE idUsuario = ? AND estado = 1
        await this.dataSource.query(
            `UPDATE authSesiones 
             SET estado = 0, fechafin = CURRENT_TIMESTAMP, idusuariomodificacion = $1
             WHERE idusuario = $2 AND estado = 1`,
            [idUsuarioModificacion, idUsuario],
        );
    }
}
