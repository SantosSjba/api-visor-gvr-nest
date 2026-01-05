import { Injectable } from '@nestjs/common';
import { INotificacionesRepository } from '../../domain/repositories/notificaciones.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class NotificacionesRepository implements INotificacionesRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) {}

    async guardarNotificacionPendiente(
        idUsuario: number,
        tipo: string,
        titulo: string,
        mensaje: string | null,
        datos: any,
    ): Promise<any> {
        const query = `
            INSERT INTO notificacionespendientes (
                idusuario, tipo, titulo, mensaje, datos
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id, idusuario, tipo, titulo, mensaje, datos,
                      entregada, fechaentrega, fechacreacion
        `;

        const result = await this.databaseFunctionService.executeQuery(query, [
            idUsuario,
            tipo,
            titulo,
            mensaje,
            JSON.stringify(datos || {}),
        ]);

        return result[0] || null;
    }

    async obtenerNotificacionesPendientes(idUsuario: number, tipo?: string): Promise<any[]> {
        let query = `
            SELECT 
                id, idusuario, tipo, titulo, mensaje, datos,
                entregada, fechaentrega, fechacreacion
            FROM notificacionespendientes
            WHERE idusuario = $1 
              AND entregada = FALSE 
              AND estado = 1
        `;
        
        const params: any[] = [idUsuario];
        
        if (tipo) {
            query += ` AND tipo = $2`;
            params.push(tipo);
        }
        
        query += ` ORDER BY fechacreacion DESC LIMIT 50`;

        const result = await this.databaseFunctionService.executeQuery(query, params);
        return result || [];
    }

    async marcarComoEntregada(id: number): Promise<void> {
        const query = `
            UPDATE notificacionespendientes
            SET entregada = TRUE,
                fechaentrega = CURRENT_TIMESTAMP,
                fechamodificacion = CURRENT_TIMESTAMP
            WHERE id = $1
        `;

        await this.databaseFunctionService.executeQuery(query, [id]);
    }

    async marcarTodasComoEntregadas(idUsuario: number): Promise<void> {
        const query = `
            UPDATE notificacionespendientes
            SET entregada = TRUE,
                fechaentrega = CURRENT_TIMESTAMP,
                fechamodificacion = CURRENT_TIMESTAMP
            WHERE idusuario = $1 
              AND entregada = FALSE
        `;

        await this.databaseFunctionService.executeQuery(query, [idUsuario]);
    }
}

