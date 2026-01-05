import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICACIONES_REPOSITORY } from '../../../domain/repositories/notificaciones.repository.interface';
import type { INotificacionesRepository } from '../../../domain/repositories/notificaciones.repository.interface';

@Injectable()
export class ObtenerNotificacionesPendientesUseCase {
    constructor(
        @Inject(NOTIFICACIONES_REPOSITORY)
        private readonly notificacionesRepository: INotificacionesRepository,
    ) {}

    async execute(userId: number, tipo?: string): Promise<any[]> {
        const notificaciones = await this.notificacionesRepository.obtenerNotificacionesPendientes(userId, tipo);
        
        // Convertir los campos JSONB a objetos
        return notificaciones.map((notif: any) => {
            // Parsear el campo datos JSONB (PostgreSQL devuelve nombres en minúsculas)
            const datos = notif.datos
                ? (typeof notif.datos === 'string' ? JSON.parse(notif.datos) : notif.datos)
                : {};
            
            // Construir la notificación combinando campos base y datos
            // Esto mantiene compatibilidad con notificaciones existentes y permite nuevos tipos
            return {
                id: `notif-${notif.id}`, // Prefijo para distinguir de notificaciones en tiempo real
                type: notif.tipo,
                title: notif.titulo,
                message: notif.mensaje || datos.message || null,
                timestamp: notif.fechacreacion 
                    ? new Date(notif.fechacreacion).toISOString() 
                    : new Date().toISOString(),
                read: false,
                // Incluir todos los datos específicos del tipo de notificación
                ...datos,
            };
        });
    }
}

