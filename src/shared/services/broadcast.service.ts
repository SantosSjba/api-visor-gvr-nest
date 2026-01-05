import { Injectable, Inject } from '@nestjs/common';
import { BroadcastGateway } from '../../presentation/gateways/broadcast.gateway';
import { NOTIFICACIONES_REPOSITORY } from '../../domain/repositories/notificaciones.repository.interface';
import type { INotificacionesRepository } from '../../domain/repositories/notificaciones.repository.interface';

/**
 * Servicio para emitir eventos de broadcasting
 * Usa el gateway de WebSocket para enviar eventos a los clientes conectados
 */
@Injectable()
export class BroadcastService {
  constructor(
    private readonly broadcastGateway: BroadcastGateway,
    @Inject(NOTIFICACIONES_REPOSITORY)
    private readonly notificacionesRepository: INotificacionesRepository,
  ) {}

  /**
   * Emite un evento de menú creado
   */
  emitMenuCreated(menu: any) {
    // Emitir sin el punto inicial (Socket.IO no necesita el punto)
    // El frontend removerá el punto al escuchar
    this.broadcastGateway.emitToChannel('menus', 'menu.created', { menu });
  }

  /**
   * Emite un evento de menú actualizado
   */
  emitMenuUpdated(menu: any) {
    // Emitir sin el punto inicial (Socket.IO no necesita el punto)
    this.broadcastGateway.emitToChannel('menus', 'menu.updated', { menu });
  }

  /**
   * Emite un evento de menú eliminado
   */
  emitMenuDeleted(menuId: number) {
    // Emitir sin el punto inicial (Socket.IO no necesita el punto)
    this.broadcastGateway.emitToChannel('menus', 'menu.deleted', { menu_id: menuId });
  }

  /**
   * Emite un evento personalizado a un canal específico
   */
  emit(channel: string, event: string, data: any) {
    this.broadcastGateway.emitToChannel(channel, event, data);
  }

  /**
   * Emite un evento a todos los clientes conectados
   */
  emitToAll(event: string, data: any) {
    this.broadcastGateway.emitToAll(event, data);
  }

  /**
   * Emite una notificación a un usuario específico
   * Si el usuario no está conectado, guarda la notificación en la base de datos
   * @param userId ID del usuario que recibirá la notificación
   * @param notification Datos de la notificación
   */
  async emitNotificationToUser(userId: number, notification: any) {
    // Verificar si el usuario está conectado
    const isConnected = this.broadcastGateway.isUserConnected(userId);
    
    if (isConnected) {
      // Usuario conectado: enviar por WebSocket
      const channel = `App.Models.User.${userId}`;
      this.broadcastGateway.emitToChannel(channel, 'notification', notification);
    } else {
      // Usuario no conectado: guardar en base de datos
      // Toda la información específica se almacena en el campo 'datos'
      await this.notificacionesRepository.guardarNotificacionPendiente(
        userId,
        notification.type || 'info',
        notification.title || 'Notificación',
        notification.message || null,
        notification, // Toda la notificación se guarda en datos para mantener compatibilidad
      );
    }
  }
}

